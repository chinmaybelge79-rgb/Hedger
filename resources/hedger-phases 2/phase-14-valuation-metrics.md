# Phase 14 — Valuation Metrics & Historical Multiples

**Prerequisite:** Phase 13 complete and merged.
**Progress:** Phase 14 of 20

> **Standing rules (apply to every phase)**
> 1. Complete **only this phase**; do not start the next. Do not mark it done until every item under *Definition of Done* passes, with evidence (test output, screenshots, or logs).
> 2. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI — missing data renders `—` (with reason), not-meaningful renders `NM`.
> 3. Every number carries **currency, unit/scale, as-of date and freshness**. Never mix currencies or substitute look-alike instruments.
> 4. The browser never calls the data provider; secrets stay server-side.
> 5. UI uses Phase 2 tokens and components only. Minimal, white, flat, Inter, tabular numbers.
> 6. If a requirement cannot be met with the available data, **stop and report** instead of approximating or fabricating.

**Goal:** Correct, consistently defined valuation ratios and their history, with explicit "not meaningful" handling and no look-ahead bias.

## 1. Ratio definitions (all computed in `packages/valuation/metrics`, same-currency numerator/denominator)
| Ratio | Formula | Not meaningful (`NM`) when |
|---|---|---|
| P/E (TTM) | `Price / diluted EPS (TTM)` | EPS ≤ 0 |
| Forward P/E | `Price / consensus EPS (next FY)` | no estimates from provider, or EPS ≤ 0 |
| P/B | `Price / book value per share`; BVPS = `common equity / shares outstanding` | equity ≤ 0 |
| P/S | `Market cap / Revenue (TTM)` | revenue ≤ 0 |
| EV/Sales | `EV / Revenue (TTM)` | revenue ≤ 0 |
| EV/EBITDA | `EV / EBITDA (TTM)` | EBITDA ≤ 0; company type is bank/NBFC/insurer |
| EV/EBIT | `EV / EBIT (TTM)` | EBIT ≤ 0 |
| FCF yield | `FCF (TTM) / Market cap` | (negative is meaningful: show it) |
| Earnings yield | `EPS (TTM) / Price` | — |
| Dividend yield | `DPS (TTM) / Price` | no dividends → `0.00%` only if provider confirms none, else `—` |
| Payout ratio | `DPS / EPS` | EPS ≤ 0 |
| PEG | `P/E / (EPS growth % × 100)` using 3Y CAGR | growth ≤ 0 or P/E NM |
| P/ABV (banks) | `Price / adjusted book value per share` | data not supplied |
Share counts: use **diluted weighted average** for EPS ratios and **latest outstanding** for BVPS and market cap — document and keep consistent.
**Worked example:** Price ₹500; TTM diluted EPS ₹25 → P/E 20.0x; BVPS ₹200 → P/B 2.5x; Market cap 50,000; debt 10,000; cash 4,000; minority 500 → EV = 50,000 + 10,000 + 500 − 4,000 = 56,500; EBITDA 5,650 → EV/EBITDA 10.0x.
`NM` renders as `NM` with tooltip *why*; `—` means data missing. Never print negative P/E values.

## 2. Historical multiples (point-in-time)
Goal: distribution of P/E, P/B, EV/EBITDA over 1Y/3Y/5Y/10Y.
- Daily `price_t` × fundamentals **as known on date t**: use the statement's `reportedAt` (filing/announcement date); if unavailable, `periodEnd + lag` (Indian companies: +60 days quarterly / +90 annual; US: +45 / +60) and flag `LAG_ASSUMED`. This avoids look-ahead bias.
- TTM EPS_t = sum of the four latest quarters *available* at t.
- Compute daily multiple series, drop `NM` days (record count dropped).
- Statistics: median, mean, p10/p25/p75/p90, ±1σ band, current **percentile rank** `= (# days with multiple < current) / N`.
- Chart: line of multiple with median line and shaded ±1σ band (Phase 11 chart reused). Label "Based on 5Y of daily data; N days excluded as NM".
**Worked example:** current P/E 20; 5Y series median 24, p25 21.5 → current percentile ≈ 18th → "Trading below its 5-year median (24.0x)". Describe factually; never say "cheap".

## 3. Sector-aware sets
| Company type | Primary multiples shown |
|---|---|
| General | P/E, EV/EBITDA, EV/Sales, P/B, FCF yield |
| Bank / NBFC | P/E, P/B, P/ABV (if supplied), dividend yield, ROE, ROA |
| Insurance | P/E, P/B, ROE, (embedded value only if supplied) |
| REIT/trust | P/FFO and distribution yield only if supplied; else P/B & yield |
| Utilities/capital-intensive | EV/EBITDA, P/B, FCF yield |

## 4. Valuation tab shell (Phase 16 fills DCF)
Sections, in order: **Summary** (current price vs intrinsic range — placeholder until Phase 16) · **Multiples now** (table, with sector median when Phase 17 ready) · **Historical multiples** (selector P/E · EV/EBITDA · P/B · range) · **Methodology notes** (definitions).

## 5. Endpoint
`GET /api/v1/instruments/:id/valuation/multiples?history=5Y` → `{ current: {...each ratio: {value|null, state:'ok'|'NM'|'missing'|'NA', inputs:{...}}}, history: {pe:{series, stats}, ...} }`. Include `inputs` so the UI can show the calculation on hover (transparent math).

## 6. Tests
Each ratio: positive case, zero, negative, missing, bank case. Historical: look-ahead test (a statement filed on day d must not influence day d−1); percentile boundary cases; fewer than 252 days → `INSUFFICIENT_HISTORY`.

## Do not
Annualise partial TTM; use period-end date as availability date without a flag; compare ratios computed in different currencies; label anything "undervalued/overvalued" from multiples alone.

## Definition of Done
- [ ] All ratios tested incl. worked examples above.
- [ ] Historical series reproducible and bias-tested.
- [ ] Banks show bank-appropriate set; no EV/EBITDA anywhere for them.
- [ ] Hover shows inputs and formula for every ratio.

---
**Next:** `phase-15-stock-screener.md`
