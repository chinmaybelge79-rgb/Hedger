# Phase 07 — Markets Dashboard

**Prerequisite:** Phase 06 complete and merged.
**Progress:** Phase 7 of 20

> **Standing rules (apply to every phase)**
> 1. Complete **only this phase**; do not start the next. Do not mark it done until every item under *Definition of Done* passes, with evidence (test output, screenshots, or logs).
> 2. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI — missing data renders `—` (with reason), not-meaningful renders `NM`.
> 3. Every number carries **currency, unit/scale, as-of date and freshness**. Never mix currencies or substitute look-alike instruments.
> 4. The browser never calls the data provider; secrets stay server-side.
> 5. UI uses Phase 2 tokens and components only. Minimal, white, flat, Inter, tabular numbers.
> 6. If a requirement cannot be met with the available data, **stop and report** instead of approximating or fabricating.

**Goal:** The Markets page, fully built against a **typed API contract** and a clearly labeled fixture adapter. Real data plugs in at Phase 9 without UI changes.

## 1. API contract (define in `packages/types` with zod; implement mock now)
```
GET /api/v1/markets/overview?region=IN|US|EU|APAC|COMMODITIES
→ { data: {
      region, marketStatus: { state:'open'|'closed'|'pre'|'post', opensAt?, closesAt?, tz },
      indices: IndexQuote[],
      breadth?: { advances:int, declines:int, unchanged:int, asOf },
      movers?: { gainers: Mover[], losers: Mover[], mostActive: Mover[] },
      sectors?: SectorPerf[],
      macro?: MacroSeries[]
    }, meta }
GET /api/v1/markets/series?ids=NIFTY50,SP500&range=1M&rebase=true
→ { data: { series: { id, name, currency, points: [t, v][] }[] }, meta }
```
`IndexQuote = { id, name, symbolProvider, value: Money-like (points, no currency), change, changePct, asOf, freshness }`.
Every optional block may be absent → section renders `unavailable` via `DataState` (never fabricated).

## 2. Layout (top → bottom)
1. `PageHeader`: "Markets" + "Global financial markets at a glance" + market status chip (e.g. `NSE · Closed · opens 09:15 IST`).
2. Region tabs: India · United States · Europe · Asia · Commodities (URL-bound).
3. **Index strip:** 5 `Stat` cards (name, value, change, % change, freshness). Horizontal scroll on mobile.
4. **Market performance chart:** selected index (default region primary) + `SegmentedControl` 1D 1W 1M 3M 6M 1Y 5Y MAX; optional compare (up to 3 series, **rebased to 100** when compared). Chart engine is a placeholder line chart now; Phase 11 swaps in the shared chart component — build a `PerformanceChart` interface now.
5. Two columns: **Market overview** (breadth bar + counts) | **Top movers** (tabs Gainers / Losers / Most active).
6. Two columns: **Sector performance** (sorted horizontal bars, % change) | **Key indicators** (yields, inflation, policy rate, FX).

## 3. Instrument lists per region (config, not code)
`/config/markets.ts`
- **IN:** NIFTY 50, NIFTY Bank, NIFTY Financial Services, NIFTY IT, S&P BSE SENSEX, NIFTY Midcap 100, NIFTY Smallcap 100.
- **US:** S&P 500, Nasdaq Composite, Nasdaq-100, Dow Jones, Russell 2000, VIX.
- **EU:** FTSE 100, DAX, CAC 40, STOXX Europe 600.
- **APAC:** Nikkei 225, Hang Seng, Shanghai Composite, KOSPI, ASX 200.
- **Commodities & FX:** Gold, Silver, Crude oil, Natural gas, Copper, USD/INR, EUR/USD, GBP/USD, USD/JPY.
Each entry stores `{ id, label, providerSymbols: {}, unit, decimals }`. `providerSymbols` (per provider) are filled **only** after Phase 9 verification. Unverified → `unavailable`, not a look-alike.

## 4. Market status logic (server, `exchange-calendar` module)
Store per exchange: IANA tz, regular hours, weekend rule, holiday list (versioned JSON, updated yearly). Examples: NSE/BSE 09:15–15:30 `Asia/Kolkata`; NYSE/Nasdaq 09:30–16:00 `America/New_York`; LSE 08:00–16:30 `Europe/London`. Output state + next open/close. Test across DST changes and holidays.

## 5. Rules for derived numbers
- Percent change = `(last − prevClose) / prevClose`; `prevClose` must come from the provider, never from the previous point in a chart series.
- Breadth bar proportions = counts / total; hide if total = 0.
- Rebased series: `v_i' = 100 × v_i / v_0` using first available common timestamp.
- Sector ordering: descending % change; ties by name.

## 6. Fixture adapter (development only)
Deterministic seeded generator in `apps/api/src/providers/fixture`. Every response from it carries `meta.source = "fixture"` and the UI shows `SAMPLE DATA` in every section badge. Production build must **fail** if the fixture adapter is selected (`NODE_ENV=production` guard).

## 7. States to design & test
Loading skeleton · partial (breadth missing) · stale (> 2× expected refresh) · market closed (shows last close, labeled) · provider error · empty movers.

## 8. Performance
Region switch < 200 ms from cache; prefetch other regions on idle; polling 30–60 s only while tab visible and market open.

## Do not
Show live-looking tickers from fixtures without the `SAMPLE DATA` label; invent economic indicators; blend currencies in one chart without rebasing.

## Definition of Done
- [ ] All five regions render with fixtures and each state above.
- [ ] Every number goes through `Num`; leakage test passes.
- [ ] Contract schemas exported and used by both API and web.
- [ ] Mobile layout reviewed at 390 px; screenshots in `docs/screens/phase-07/`.

---
**Next:** `phase-08-instrument-model-search.md`
