# Phase 15 — Stock Screener

**Prerequisite:** Phase 14 complete and merged.
**Progress:** Phase 15 of 20

> **Standing rules (apply to every phase)**
> 1. Complete **only this phase**; do not start the next. Do not mark it done until every item under *Definition of Done* passes, with evidence (test output, screenshots, or logs).
> 2. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI — missing data renders `—` (with reason), not-meaningful renders `NM`.
> 3. Every number carries **currency, unit/scale, as-of date and freshness**. Never mix currencies or substitute look-alike instruments.
> 4. The browser never calls the data provider; secrets stay server-side.
> 5. UI uses Phase 2 tokens and components only. Minimal, white, flat, Inter, tabular numbers.
> 6. If a requirement cannot be met with the available data, **stop and report** instead of approximating or fabricating.

**Goal:** A fast, server-side screener with consistent definitions, applicability rules by company type, and shareable URLs.

## 1. Data model
Nightly job builds `screener_snapshot` (one row per active equity instrument) from normalised data (Phases 10–14):
`instrument_id, symbol, name, exchange, country, currency, sector, industry, company_type, price, change_1d_pct, market_cap_usd, market_cap_local, pe_ttm, fwd_pe, pb, ev_ebitda, ev_sales, fcf_yield, rev_growth_1y, rev_cagr_3y, eps_growth_1y, gross_margin, op_margin, net_margin, roe, roic, debt_equity, net_debt_local, interest_cov, current_ratio, volume, avg_volume_3m, dist_52w_high_pct, dist_52w_low_pct, as_of, data_quality_score` plus per-column `*_state` (`ok|NM|missing|NA`) or a compact bitmask.
Indexes on country, exchange, sector, company_type, and each filterable numeric column; materialised refresh is atomic (swap tables) so readers never see partial data.
Prices/volume columns refresh intraday if quotes are cached; fundamentals nightly.
Cross-market market-cap comparison uses a stored `market_cap_usd` with `fxRate`, `fxAsOf` shown on hover.

## 2. Filter registry (single source for UI, API validation and SQL)
```ts
{ key:'roe', label:'Return on equity', unit:'percent', group:'Profitability',
  applicableTo:['general','bank','nbfc','insurance'], op:['gt','lt','between'],
  definitionRef:'METRICS#roe', requires:['common_equity','net_income'] }
```
Groups: Market (country, exchange, sector, industry, market cap) · Valuation (P/E, fwd P/E, P/B, EV/EBITDA, EV/Sales, FCF yield) · Growth (revenue, earnings, EPS) · Profitability (gross/operating/net margin, ROE, ROIC) · Financial health (debt/equity, net debt, interest coverage, current ratio) · Trading (price change, volume, avg volume, distance from 52W high/low).
**Rule:** a filter appears only when ≥ 90% of the selected universe has a valid (`ok`) value *and* its definition is consistent across company types in scope. Otherwise the filter is disabled with the reason ("Not applicable to banks"). When a filter is active, rows whose value is `NM`/`missing`/`NA` are **excluded** and the result header says `412 matches · 37 excluded (data not applicable/missing)`.

## 3. API
```
GET /api/v1/screener?country=IN&exchange=NSE&sector=...&f=roe:gt:15;pe_ttm:lt:25&sort=market_cap_local:desc&page=1&pageSize=50
→ { data:{ rows:[...], total, excluded, columns:[...] }, meta:{ asOf, universe, source } }
```
- Validate with zod from the registry; reject unknown keys/ops; clamp `pageSize ≤ 100`.
- Build SQL with parameterised queries only (no string concatenation). Sort columns whitelisted.
- Percent inputs are **percent numbers** in the UI (15 = 15%); stored as fractions (0.15); conversion happens in exactly one function with tests.
- Market-cap filter units: UI offers `Cr` for INR-dominant universe and `M/B` otherwise; the server receives base currency units.
- Performance: p95 < 300 ms for 5,000 rows with 5 filters; use `EXPLAIN` in CI on the 3 heaviest queries.

## 4. UI
- Left/top filter bar: Market selector (country, exchange) + "Add filter" menu grouped by category; active filters as removable chips with editable ranges. (Keep the basic layout from the plan: market, exchange, sector, market cap, P/E, revenue growth, ROE; others via "Add filter".)
- Results `DataTable`: columns Company (symbol, exchange), Price, Change, Market cap, P/E, ROE + user-selectable extra columns; click header to sort (tri-state); sticky header; pagination; row click → company page; `as of` timestamp and universe size in the header.
- Preset screens (static, transparent definitions): *Profitable & low debt*, *Quality at a reasonable multiple*, *High dividend yield with positive FCF*. Each preset shows its exact criteria; no "best stocks" claims.
- Export CSV (current result page or all matches up to 1,000).
- URL encodes everything; "Reset" clears filters; "Save screen" appears after Phase 18.
- Empty result state suggests loosening the most restrictive filter (computed server-side by counting matches with each filter removed).

## 5. Worked example (integration test with seeded snapshot)
Universe of 5 NSE rows: ROE = 22%, 18%, 9%, NM, missing; P/E = 18, 30, 12, 10, 15. Filter `roe > 15 AND pe < 25` → only row 1 matches; excluded count = 2 (rows 4–5 lack ROE) and row 2 fails P/E, row 3 fails ROE. Assert `total=1, excluded=2`.

## 6. Tests
Registry applicability (banks excluded from EV/EBITDA); unit conversion; SQL-injection attempts in sort/filter; pagination stability (sort tie-break by `instrument_id`); snapshot swap atomicity.

## Do not
Allow filters on undefined metrics; compute metrics inside the query on the fly; treat missing as zero.

## Definition of Done
- [ ] Screener works for India and US with ≥ 5 simultaneous filters.
- [ ] Worked example test passes; excluded counts visible to the user.
- [ ] Performance budget met in CI.
- [ ] URL round-trips (copy link → identical results).

---
**Next:** `phase-16-valuation-engine-dcf.md`
