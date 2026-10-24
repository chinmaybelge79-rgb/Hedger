# Phase 11 — Historical Prices & Interactive Charts

**Prerequisite:** Phase 10 complete and merged.
**Progress:** Phase 11 of 20

> **Standing rules (apply to every phase)**
> 1. Complete **only this phase**; do not start the next. Do not mark it done until every item under *Definition of Done* passes, with evidence (test output, screenshots, or logs).
> 2. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI — missing data renders `—` (with reason), not-meaningful renders `NM`.
> 3. Every number carries **currency, unit/scale, as-of date and freshness**. Never mix currencies or substitute look-alike instruments.
> 4. The browser never calls the data provider; secrets stay server-side.
> 5. UI uses Phase 2 tokens and components only. Minimal, white, flat, Inter, tabular numbers.
> 6. If a requirement cannot be met with the available data, **stop and report** instead of approximating or fabricating.

**Goal:** One shared, fast, accurate chart component (TradingView Lightweight Charts) used on Markets and Company pages.

## 1. API
```
GET /api/v1/instruments/:id/prices?range=1Y&interval=1d&adjust=split|total|none
→ { data: { bars: [{ t: epochSec, o, h, l, c, v }], currency, timezone, adjustment, firstTradeDate }, meta }
GET /api/v1/compare/prices?ids=a,b,c&range=1Y&rebase=100
```
### Range → interval defaults
| Range | Interval | Notes |
|---|---|---|
| 1D | 5m (or 1m if supported) | Intraday, exchange timezone, show session breaks |
| 1W | 15m/30m | Only if provider supplies; else fall back to 1d and label |
| 1M, 3M, 6M, YTD | 1d | |
| 1Y | 1d | |
| 5Y | 1wk | |
| MAX | 1mo | Start at `firstTradeDate` |
If intraday isn't available for an instrument/exchange (per Phase 9 matrix), **disable the 1D/1W buttons** with a tooltip, don't fake with daily data.

## 2. Chart component (`<PriceChart />`)
- Modes: **Line** (default), **Area** (subtle), **Candles**, plus **Volume** pane toggle. Max 3 comparison series.
- Controls: range segmented control, mode toggle, log scale toggle, adjusted/unadjusted toggle (advanced), `Compare` (search-to-add; comparisons are **rebased to 100**).
- Crosshair tooltip: date (exchange tz), O/H/L/C, volume, % change from range start; currency shown.
- Timezone: render time axis in exchange timezone, label it.
- Style per Phase 2 §7: hairline grid, no chart border, last-price tag, `--up/--down` only on candles/volume.
- Resizes with container (`ResizeObserver`), touch pan/zoom, double-click reset.
- Accessible: chart has `role="img"` with a text summary ("Price rose 12.4% over 1Y, from ₹X to ₹Y"), and a "View data table" disclosure for keyboard/screen-reader users.

## 3. Calculations (server computes; tested)
Let `P0` = first adjusted close in range, `P1` = last.
- **Period return** = `P1 / P0 − 1`.
- **CAGR** (ranges > 1Y) = `(P1 / P0)^(1 / years) − 1`, `years = days/365.25`.
- **52-week high/low:** max `high` / min `low` over trailing 252 trading bars (or 365 calendar days — pick one, document it, use the same in screener).
- **Distance from 52W high** = `P / High52 − 1`.
- **Annualised volatility** (optional) = `stdev(ln(Pt/Pt−1)) × √252`.
- **Rebase:** `v' = 100 × v / v0` where `v0` is the first timestamp common to *all* selected series.
**Worked example:** closes 100 → 125 over 3.0 years: return +25.0%, CAGR = `1.25^(1/3) − 1` = 7.72%.

## 4. Performance
- Return ≤ 2,000 points per request; downsample longer series server-side with **LTTB** while preserving first/last/high/low.
- Daily history stored in Postgres; extend the cache incrementally (only fetch missing tail).
- Chart bundle lazy-loaded; initial render < 150 ms after data arrival.

## 5. Edge cases (tests)
Newly listed (short history) · trading halts / gaps · splits mid-range (adjusted continuity) · zero-volume days · currency of ADR vs local · holidays differing across compared markets (align on dates, don't interpolate) · missing bars flagged, not zero-filled.

## 6. Integrations
- Markets page: replace placeholder `PerformanceChart` (Phase 7) with this component using index series.
- Company page `Charts` tab placeholder ready; Overview mini-chart uses `Area` with 1Y default.
- Price-performance table (1D, 1W, 1M, 3M, 6M, YTD, 1Y, 3Y, 5Y) computed from daily bars with the formulas above.

## Do not
Use unadjusted prices across splits by default; invent intraday data; plot different currencies on one absolute axis.

## Definition of Done
- [ ] Charts render correctly for one instrument per region incl. an LSE pence-quoted stock and a split example.
- [ ] Formulas verified by unit tests (worked example included).
- [ ] 1D/1W correctly disabled where intraday is unsupported.
- [ ] Lighthouse performance unaffected beyond budget; a11y summary + data table present.

---
**Next:** `phase-12-company-overview.md`
