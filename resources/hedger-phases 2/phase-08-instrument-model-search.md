# Phase 08 — Instrument Model & Company Search

**Prerequisite:** Phase 07 complete and merged.
**Progress:** Phase 8 of 20

> **Standing rules (apply to every phase)**
> 1. Complete **only this phase**; do not start the next. Do not mark it done until every item under *Definition of Done* passes, with evidence (test output, screenshots, or logs).
> 2. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI — missing data renders `—` (with reason), not-meaningful renders `NM`.
> 3. Every number carries **currency, unit/scale, as-of date and freshness**. Never mix currencies or substitute look-alike instruments.
> 4. The browser never calls the data provider; secrets stay server-side.
> 5. UI uses Phase 2 tokens and components only. Minimal, white, flat, Inter, tabular numbers.
> 6. If a requirement cannot be met with the available data, **stop and report** instead of approximating or fabricating.

**Goal:** Reliable identification of securities across exchanges. Searching "Reliance" must return the correct Indian listing first; "Apple" must return Apple Inc. (US).

## 1. Instrument identity model (Postgres via Prisma)
```
Instrument {
  id            uuid PK
  symbol        text        -- Hedger canonical, e.g. RELIANCE.NS, AAPL, 7203.T
  providerSymbols jsonb     -- per provider, e.g. { yfinance:'RELIANCE.NS', finnhub:'…', alphavantage:'…' }; each verified in Phase 9, absent = unsupported
  name          text
  nameAliases   text[]      -- "Reliance", "RIL", "Apple", "Alphabet Class A"
  exchangeMic   text        -- XNSE, XBOM, XNAS, XNYS, XLON, XETR, XPAR, XAMS, XCSE, XTKS, XKRX, XTAI, XHKG, XASX
  country       char(2)
  currency      char(3)     -- trading currency; see minor-unit note in Phase 10
  isin          text?
  instrumentType 'equity'|'etf'|'index'|'fx'|'commodity'
  shareClass    text?       -- 'A','B','C','ADR','GDR'
  issuerId      uuid FK -> Issuer   -- groups multiple listings of same company
  sector, industry, status ('active'|'delisted'|'suspended')
  marketCapRank int?, updatedAt
}
Issuer { id, legalName, countryOfIncorporation, lei? }
```
One **Issuer** can have many **Instruments** (e.g. Alphabet GOOGL/GOOG; TSMC 2330.TW and TSM ADR; Alibaba 9988.HK and BABA).

## 2. Seed universe (`seed/universe.json`) — provider symbols are *candidates* to verify in Phase 9
| Region | Candidates |
|---|---|
| India (NSE) | RELIANCE.NS, ONGC.NS, HDFCBANK.NS, ICICIBANK.NS, SBIN.NS, TCS.NS, INFY.NS, WIPRO.NS, HINDUNILVR.NS, ITC.NS, TATAMOTORS.NS*, M&M.NS, LT.NS, SUNPHARMA.NS, DRREDDY.NS, BHARTIARTL.NS |
| US | AAPL, MSFT, NVDA, AMZN, GOOGL, GOOG, META, BRK-B, JPM, WMT, XOM |
| Europe | ASML.AS, SAP.DE, NOVO-B.CO, MC.PA, SHEL.L, HSBA.L, SIE.DE |
| APAC | 7203.T, 6758.T, 005930.KS, 2330.TW, 0700.HK, 9988.HK, BHP.AX |
\* Tata Motors' listed structure changed after its corporate demerger; **confirm the current tickers with the provider and exchange before seeding**, and record the outcome in `DECISIONS.md`. Do not assume any symbol above is still valid.
Also seed each Indian company's BSE listing (`.BO`) where supported, marked as secondary.

## 3. Search API
```
GET /api/v1/search?q=reliance&limit=10&region=IN?
→ { data: { results: [{ instrumentId, symbol, name, exchange, exchangeMic, country, currency, type, shareClass?, issuerId, matchType, score }], groups? }, meta }
GET /api/v1/instruments/resolve?symbol=RELIANCE   -- returns candidates when ambiguous
```
### Matching & ranking (deterministic, unit-tested)
1. Normalise query: lowercase, strip punctuation, collapse spaces, remove corporate suffixes (`ltd`, `limited`, `inc`, `corp`, `plc`, `ag`, `sa`) for name matching.
2. Match tiers (higher beats lower): **exact symbol** (1000) → **symbol prefix** (800) → **exact normalised name/alias** (700) → **name/alias prefix** (500) → **token match** (300) → **trigram fuzzy** with `similarity ≥ 0.35` (≤ 200).
3. Tie-breakers, in order: primary listing over secondary (e.g. NSE over BSE; home exchange over ADR) → larger market-cap rank → shorter name.
4. Optional `region` bias adds +50 to instruments in that country (set from the user's locale; **never** override an exact-symbol match).
5. Return different listings of the same issuer as separate, clearly labeled rows (`Reliance Industries · NSE · INR`, `Reliance Industries · BSE · INR`).
Postgres: `pg_trgm` GIN index on normalised name and aliases; symbol column with `text_pattern_ops` index.

## 4. UI
- Command palette (`⌘K`): input, grouped results (Companies · Indices later), each row = name (primary), `SYMBOL · EXCHANGE · CURRENCY` (muted), type badge for ADR/class.
- Debounce 150 ms; cancel in-flight requests; show skeleton on > 120 ms; arrow-key navigation, `Enter` opens `/company/:symbol`, `Esc` closes.
- Empty state suggests checking spelling and shows popular companies (from seeded ranks, not fabricated popularity).
- Recent searches stored in `localStorage` (client-only, clearable).
- Filtering chips: All · India · US · Europe · Asia-Pacific.

## 5. Acceptance tests (automate)
| Query | Expect first result |
|---|---|
| `reliance` | RELIANCE.NS (NSE) |
| `apple` | AAPL (Nasdaq) |
| `AAPL` | AAPL |
| `tcs` | TCS.NS |
| `hdfc bank` | HDFCBANK.NS |
| `alphabet` | GOOGL and GOOG both listed, share class labelled |
| `tsmc` | 2330.TW first, TSM (ADR) clearly labelled |
| `m&m` | M&M.NS |
| `relaince` (typo) | RELIANCE.NS via fuzzy |
| `asdkjh` | empty state |
Latency: p95 < 80 ms on the seeded universe.

## 6. Admin script
`pnpm universe:verify` — checks every seeded symbol resolves, no duplicate canonical symbols, every instrument has exchange, currency, country. Fails CI on violations.

## Do not
Call the provider's search endpoint from the browser; return a listing whose currency or exchange is unknown.

## Definition of Done
- [ ] Prisma schema + migrations committed; seed loads without errors.
- [ ] All acceptance queries pass as automated tests.
- [ ] Keyboard and screen-reader navigation verified.
- [ ] `universe:verify` runs in CI.

---
**Next:** `phase-09-market-data-integration.md`
