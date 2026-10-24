# Phase 09 — Multi-Provider Market Data Integration (Finnhub · Alpha Vantage · yfinance)

**Prerequisite:** Phase 08 complete and merged.
**Progress:** Phase 9 of 20

> **Standing rules (apply to every phase)**
> 1. Complete **only this phase**; do not start the next. Do not mark it done until every item under *Definition of Done* passes, with evidence (test output, screenshots, or logs).
> 2. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI — missing data renders `—` (with reason), not-meaningful renders `NM`.
> 3. Every number carries **currency, unit/scale, as-of date and freshness**. Never mix currencies or substitute look-alike instruments.
> 4. The browser never calls the data provider; secrets stay server-side.
> 5. UI uses Phase 2 tokens and components only. Minimal, white, flat, Inter, tabular numbers.
> 6. If a requirement cannot be met with the available data, **stop and report** instead of approximating or fabricating.

**Goal:** Connect **Finnhub, Alpha Vantage and yfinance** behind one provider-agnostic Market Data Service, with explicit routing, quota control, provenance, and evidence-based capability verification. No guessing about what any provider supplies.

> **Revision note (v2 architecture).** This phase replaces the earlier single-provider design. Data flow is: `Frontend → Hedger API → Market Data Service → [Finnhub | Alpha Vantage | yfinance] → Normalization (Phase 10) → Validation → PostgreSQL + Cache → API response`.

## 0. Provider reality check (free tiers, as of Oct 2026 — **re-verify in the probe; plans change**)
| Provider | Free-tier facts to design around | Implication |
|---|---|---|
| **Finnhub** | 60 calls/min. Free plan covers **US** fundamentals/standardised statements, company profile, 1 year of company news; international market data, estimates and detailed financials need a paid plan; some candle endpoints have been reported as paid-only. Free licence is stated as **personal use**. | Good for US quotes/profile/news/statements. **Not** a source for India or other international fundamentals on a free key. |
| **Alpha Vantage** | **25 requests/day, 5/min** on a free key; one symbol per call; free history limited to `compact` (≈100 points); some endpoints (e.g. adjusted daily) premium-only; paid from ~$49.99/month (75/min). Supports some international tickers (verify per symbol). Returns the string `"None"` for missing fundamentals. | Far too small to serve user traffic. Use only for **background spot-checks / reconciliation**, never in a request path. |
| **yfinance** | A **Python** library wrapping unofficial Yahoo Finance endpoints. No SLA; can break or get rate-limited/blocked without notice. Its own documentation positions it for personal/research use under Yahoo's terms. | Likely the only free source with India/Europe/APAC statements and prices — and the highest legal and stability risk. |
**Consequence:** on free keys, Indian and global coverage depends on yfinance. That is acceptable for a prototype/personal tool; for a public commercial launch it needs a licensed source (Phase 20 gate). The adapter design below keeps that swap cheap.

## 1. Decision gate (do first; record in `DECISIONS.md`)
1. Which mode: **A) personal/research build** or **B) public commercial product**?
2. For each provider: plan, limits, licence text for display/caching/redistribution, documentation URL.
3. If B and any needed dataset is licensed for personal use only → log it in `OPEN_QUESTIONS.md` with the replacement plan (e.g. a paid provider through the same interface).

## 2. Architecture
```
Hedger API ──► MarketDataService
                 ├─ ProviderRouter (per dataset × region priority, §4)
                 ├─ QuotaBudgeter  (per-provider limits, §5)
                 ├─ FinnhubAdapter      (HTTP, Node)
                 ├─ AlphaVantageAdapter (HTTP, Node)
                 └─ YfinanceAdapter ──► yf-gateway (Python/FastAPI sidecar, private network)
                          ▼
                    Raw payloads ──► Normalization & validation (Phase 10) ──► Postgres + cache
```
**yfinance sidecar:** yfinance is Python, so run `services/yf-gateway` (FastAPI) exposing narrow JSON endpoints (`/quote`, `/history`, `/statements`, `/info`, `/actions`). Reachable only on the internal network, authenticated with a shared secret header, strict input validation (symbol regex), timeouts, no passthrough of arbitrary URLs. Pin the yfinance version; upgrade deliberately with the probe re-run. (Alternative: the `yahoo-finance2` npm package removes the sidecar but carries the same unofficial-source risk.)

## 3. Provider interface (`apps/api/src/providers/types.ts`)
```ts
interface MarketDataProvider {
  readonly id: 'finnhub' | 'alphavantage' | 'yfinance' | 'fixture';
  capabilities(): Promise<CapabilityReport>;        // incl. limits, licence note, supported regions
  searchInstruments?(q: string): Promise<RawSearchHit[]>;
  getQuote(symbols: string[]): Promise<RawQuote[]>;
  getHistory(symbol: string, o: {interval: string; start?: Date; end?: Date; adjusted: boolean}): Promise<RawBar[]>;
  getProfile(symbol: string): Promise<RawProfile>;
  getStatements(symbol: string, type: 'income'|'balance'|'cashflow', period: 'annual'|'quarterly'): Promise<RawStatement>;
  getKeyStats?(symbol: string): Promise<RawKeyStats>;
  getCorporateActions?(symbol: string): Promise<RawAction[]>;
  getNews?(symbol: string): Promise<RawNewsItem[]>;
}
```
`Raw*` = exact provider payload (zod with `.passthrough()`), plus `{ provider, endpoint, retrievedAt, requestId }`. Normalization is Phase 10, not here. Each provider needs its own symbol: use `Instrument.providerSymbols[provider]` (Phase 8); a missing entry means "unsupported", never "guess".

## 4. Provider router (`routing.ts`, config not code)
Rules:
1. **One source of record per (instrument, dataset).** Fallback happens only on failure/quota exhaustion, is labeled (`meta.source`, `meta.fallbackFrom`), and is logged.
2. **Never splice a time series across providers** (statements, price history). If the source changes, re-fetch the entire series from the new source and flag `SOURCE_CHANGED`. Providers differ in definitions, adjustments and units; mixing years from two sources silently corrupts ratios.
3. Routing is by **region × dataset**, validated against the capability matrix; the table below is an *initial hypothesis* the probe must confirm or overwrite.
| Dataset | US | India (NSE/BSE) | Europe / APAC |
|---|---|---|---|
| Quote | Finnhub → yfinance | yfinance | yfinance |
| Daily history (adjusted) | yfinance (→ Finnhub if plan allows) | yfinance | yfinance |
| Statements (annual/qtr) | Finnhub → yfinance | yfinance | yfinance |
| Profile / key stats | Finnhub (profile), yfinance (stats) | yfinance | yfinance |
| News | Finnhub | none unless probe proves otherwise (hide section) | none |
| Reconciliation checks | Alpha Vantage (background only) | Alpha Vantage (if it supports the ticker) | same |
4. If no provider is eligible → `NOT_SUPPORTED_FOR_INSTRUMENT` → UI shows `unavailable` with a reason (Phase 6).

## 5. Quota budgeter
- Per-provider token buckets sized to 80% of limits: Finnhub 60/min; Alpha Vantage 5/min **and** a persisted daily counter (25/day; confirm reset time in the probe); yfinance self-imposed ≈ 1–2 req/s with jitter and per-IP concurrency cap.
- Priority classes: `user` > `warm` > `reconcile` > `backfill`. Lower classes are refused first when budget is tight.
- **Alpha Vantage is blocked from the user request path** (assertion + test).
- Budget dashboard at `/dev/quota`: used/remaining per provider, 429 counts.
- Plan the daily budget explicitly. Example: universe of 40 instruments × (quote + statements + history) refreshed by cache TTLs; compute calls/day and prove it fits each limit.

## 6. Resilience (per provider)
Timeouts (connect 3 s / total 8 s; 20 s for yfinance statements), ≤ 2 retries with exponential backoff + jitter, honour `Retry-After`; circuit breaker per provider (open after 5 failures / 30 s; half-open probe); single-flight request coalescing; batch where supported. yfinance extras: detect empty/NaN frames as failure (it can return empty data without an error), rotate nothing sneaky (no proxy rotation or scraping evasion), serve **last-good cache** up to its stale limit with `meta.freshness='stale'`.

## 7. Capability verification matrix (script + report)
`pnpm provider:probe` calls **each provider** for a probe set (≥ 3 instruments per region and instrument type) and writes `docs/PROVIDER_CAPABILITIES.md`: rows = capability, columns = provider × region (NSE, BSE, US, UK, EU, JP, HK, KR, TW, AU, index, FX, commodity). Cell = ✅ / ⚠️ partial / ❌ with a link to the saved sample payload. Record: field names, units/scale, currency, fiscal conventions, observed latency, quota headers, error shapes, and whether values are strings (`"None"`) or null.
**Gate:** if a must-have (quote, daily history, annual statements, shares outstanding) has no eligible provider for a region, mark the region *unsupported* in config — do not fake it.

## 8. Cross-provider reconciliation (verification mode, not blending)
Nightly background job (class `reconcile`) samples N instruments and compares provider A (source of record) with B (Alpha Vantage/Finnhub/yfinance): price, market cap, shares, revenue, net income, total assets. Tolerances: price 0.5%, market cap 2%, statement items 1%. Mismatch → `PROVIDER_DISAGREE` quality flag + a row in `/dev/quality` with both values and payload ids. It **never overwrites** displayed data; it informs trust decisions and routing changes.

## 9. Caching & persistence (budget-aware)
| Data | TTL open | TTL closed | Stale-while-revalidate |
|---|---|---|---|
| Quote | 30–60 s | until next open | 5 min |
| Intraday bars | 60 s | until next open | 10 min |
| Daily history | 6 h | 24 h | 7 d |
| Profile | 7 d | 7 d | 30 d |
| Statements | 24 h | 24 h | 30 d |
| Key stats | 1 h | 12 h | 3 d |
| News | 5 min | 15 min | 1 h |
Persist validated history/statements in Postgres (Phase 10) so a quota outage degrades to **stored data**, not blank pages. Cache key `provider:endpoint:symbol:params-hash`; cache only validated responses; errors ≤ 15 s. Store raw payloads (compressed, 30 d) keyed by request id for debugging wrong-number reports; strip secrets from logs.

## 10. Markets page
Fill `providerSymbols` in `markets.ts` only for index/FX/commodity symbols that passed the probe for the routed provider. Anything unverified stays `unavailable`. Remove `SAMPLE DATA` badges only for sections now backed by real data.

## 11. Error taxonomy
`PROVIDER_UNAVAILABLE`, `RATE_LIMITED`, `QUOTA_EXHAUSTED`, `SYMBOL_NOT_FOUND`, `NOT_SUPPORTED_FOR_INSTRUMENT`, `SCHEMA_MISMATCH` (alert!), `EMPTY_PAYLOAD`, `STALE_SERVED`, `SOURCE_CHANGED`. Mapped to `DataState` statuses (Phase 6).

## 12. Security
Keys only in server env (`FINNHUB_API_KEY`, `ALPHAVANTAGE_API_KEY`, `YF_GATEWAY_URL`, `YF_GATEWAY_SECRET`); never logged or sent to the browser; outbound allow-list per provider host; sidecar not publicly routable; API rate limit (e.g. 120 req/min/IP) to protect quotas.

## 13. Testing
- Recorded, sanitised fixtures per provider; contract tests (zod) per provider.
- Router tests: failover labelled, **no splicing** (switching source triggers full re-fetch + `SOURCE_CHANGED`), unsupported region returns `NOT_SUPPORTED_FOR_INSTRUMENT`.
- Quota tests: Alpha Vantage never called from a `user` request; daily counter persists across restarts.
- Chaos: 429s, timeouts, malformed JSON, empty yfinance frames, `"None"` strings, extra fields.
- Weekly scheduled `provider:probe` in CI (alert on drift, non-blocking).

## Do not
Normalize here; call any provider from `apps/web`; blend fields or series from different providers; use Alpha Vantage on the user path; hide unsupported regions; scrape around rate limits or rotate IPs to evade them.

## Definition of Done
- [ ] Decision gate recorded (personal vs commercial, licences per provider).
- [ ] `PROVIDER_CAPABILITIES.md` generated from real calls for all three providers, with sanitised sample payloads.
- [ ] Three adapters + yf-gateway implemented; router, quota budgeter, breaker and single-flight tested.
- [ ] Reconciliation job runs and reports to `/dev/quality`; daily call budget documented and within limits.
- [ ] No secret in the web bundle, logs or error responses (automated scan); sidecar unreachable from the public internet.

---
**Next:** `phase-10-data-normalization.md`
