# Phase 16 — Valuation Engine: DCF, Reverse DCF, Scenarios, Sensitivity

**Prerequisite:** Phase 15 complete and merged.
**Progress:** Phase 16 of 20

> **Standing rules (apply to every phase)**
> 1. Complete **only this phase**; do not start the next. Do not mark it done until every item under *Definition of Done* passes, with evidence (test output, screenshots, or logs).
> 2. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI — missing data renders `—` (with reason), not-meaningful renders `NM`.
> 3. Every number carries **currency, unit/scale, as-of date and freshness**. Never mix currencies or substitute look-alike instruments.
> 4. The browser never calls the data provider; secrets stay server-side.
> 5. UI uses Phase 2 tokens and components only. Minimal, white, flat, Inter, tabular numbers.
> 6. If a requirement cannot be met with the available data, **stop and report** instead of approximating or fabricating.

**Goal:** A pure, deterministic, well-tested valuation library (`packages/valuation`) and a transparent DCF workspace. This is Hedger's core differentiator — accuracy beats cleverness.

## 0. Architecture rules
- `packages/valuation` is **pure TypeScript**: no I/O, no `Date.now()`, no randomness. Same inputs → same outputs. All numbers use `decimal.js`.
- Inputs: a `ValuationInputs` object (normalised data + assumptions). Outputs: result **plus a full calculation trace** (every intermediate value) so the UI can show the math.
- **Company-type router:** `general → FCFF DCF` · `bank|nbfc|insurance → Residual Income / DDM (no FCFF)` · `reit_trust` → DDM/AFFO-based (v1: show "Model not available" if inputs missing) · `unknown → refuse` with explanation. Applying FCFF DCF to a bank is a **blocking bug**.
- Currency consistency: cash flows, discount rate, and the final per-share value are all in **one currency** (the reporting currency, then converted explicitly for the quote if different, with FX shown).

## 1. FCFF model (general companies)
Explicit forecast **N = 10 years**: Years 1–5 *explicit*, Years 6–10 *fade* (growth and margin fade linearly to terminal values).
```
Revenue_t   = Revenue_{t-1} × (1 + g_t)
EBIT_t      = Revenue_t × EBITmargin_t
NOPAT_t     = EBIT_t × (1 − taxRate_t)
Reinvest_t  = (Revenue_t − Revenue_{t-1}) / SalesToCapital           # ΔRevenue ÷ sales-to-capital
FCFF_t      = NOPAT_t − Reinvest_t
```
Alternative decomposition shown in the trace: `FCFF = EBIT(1−t) + D&A − Capex − ΔNWC`; the user can choose either input style, but the engine stores one canonical path.
**Defaults from history (editable):** base revenue = TTM; `g_1` from consensus if supplied else 3Y revenue CAGR capped to [−5%, 25%]; margin = 3Y median EBIT margin; tax = effective rate (3Y avg, 0–35%) fading to marginal rate; sales-to-capital = 3Y median `ΔRevenue / ΔInvestedCapital` clipped to [0.5, 5] (flag `DEFAULT_CLIPPED`).
**Fade:** `g_t = g_5 + (g_term − g_5) × (t − 5)/5` for t = 6..10, same for margin and tax.

### Discounting
- Year-end: `DF_t = 1 / (1 + WACC)^t`.
- Mid-year option (default off): `DF_t = 1 / (1 + WACC)^(t − 0.5)`; terminal value then discounted at `N − 0.5` only when using the Gordon formula with mid-year flows (document; test).
```
PV_explicit = Σ_{t=1..N} FCFF_t × DF_t
```

### Terminal value (two methods, Gordon default)
**Gordon growth with value-driver reinvestment:**
```
NOPAT_{N+1} = NOPAT_N × (1 + g)
ReinvestRate = g / ROIC_terminal          # ROIC_terminal default = WACC (no value creation) or user-set
FCFF_{N+1}  = NOPAT_{N+1} × (1 − ReinvestRate)
TV_N        = FCFF_{N+1} / (WACC − g)
PV_TV       = TV_N × DF_N
```
**Exit multiple cross-check:** `TV_N = EBITDA_N × multiple`; show the implied perpetual growth `g_implied = (TV × WACC − FCFF_N) / (TV + FCFF_N)` and the implied EV/EBITDA multiple of the Gordon TV. Show both side by side; default valuation uses Gordon.
**Constraints (hard validation, errors not warnings):** `WACC > g + 0.5%`; `g ≤ risk-free rate` (long-run nominal ceiling) and ≤ 6% for INR / ≤ 4% for USD defaults; `ROIC_terminal ≥ 0`; `0 < taxRate < 0.5`. **Warnings:** TV share of EV > 75%; terminal ROIC ≫ WACC; margin above best historical by > 5 pts; revenue CAGR > 20% for > 5 years.

### Equity bridge
```
EV                    = PV_explicit + PV_TV
Equity value (FCFF)   = EV − total debt − leases(*) − preferred − minority interest + cash & ST investments + non-operating assets
Intrinsic value/share = Equity value / diluted shares (treasury-stock method)
Upside/downside       = Intrinsic / Price − 1  (same currency)
```
(*) Leases: **consistent treatment** — if lease expense is already inside EBIT (pre-IFRS16/Ind AS 116 view), exclude lease liabilities from debt; if EBITDA/EBIT exclude lease interest (post-IFRS16), include them. Engine has `leaseTreatment: 'operating'|'debt'` and tests both.
Diluted shares: `basic + Σ in-the-money options × (1 − strike/price)` if data available; else reported diluted shares (flag).

## 2. WACC module
```
Ke   = rf + β × ERP + CRP                                (CAPM; CRP = country risk premium, optional)
Kd   = pre-tax cost of debt = rf + credit spread  (or interest expense / average debt, clipped [rf, rf+10%])
WACC = E/(D+E) × Ke + D/(D+E) × Kd × (1 − t)
```
- **Currency rule:** rf and ERP must be for the same currency as the cash flows. India (INR cash flows): rf = 10-year Government of India bond yield; ERP user-set (default from a documented source, editable, with source and date stored). USD flows: US 10Y.
- Beta: regression of 5Y weekly returns vs the *local* benchmark (NIFTY 50 / S&P 500) when data allows; **Blume adjustment** `β_adj = 0.67 × β_raw + 0.33`. Industry beta alternative: `β_L = β_U × (1 + (1 − t) × D/E)`; unlever peers `β_U = β_L / (1 + (1 − t) × D/E)`, average, relever to target D/E.
- Weights: market-value equity, debt at book (or market if available); target structure option.
- Every input editable and tagged `source`/`asOf`; default values are suggestions, never hidden.
- Hard bounds: WACC ∈ [5%, 25%]; outside → blocking validation.
**Worked WACC example:** rf 7.0%, β 1.0, ERP 6.0% → Ke 13.0%. Kd 9.0%, t 25% → after-tax 6.75%. E 80%, D 20% → WACC = 0.8×13.0 + 0.2×6.75 = 10.40 + 1.35 = **11.75%**.

## 3. Financials (banks, NBFCs, insurers): Residual Income model
Value of equity (not EV; no EV bridge):
```
RI_t         = (ROE_t − Ke) × BV_{t−1}
BV_t         = BV_{t−1} + NI_t − Div_t   (clean surplus)
Equity value = BV_0 + Σ_{t=1..N} RI_t / (1+Ke)^t + TV_RI / (1+Ke)^N
TV_RI        = RI_{N+1} / (Ke − g)  with ROE fading toward Ke (persistence ω ∈ [0,1]: RI_{N+k} = ω^k × RI_N)
Value/share  = Equity value / shares
```
Cross-check with **Gordon DDM**: `Value = DPS_1 / (Ke − g)` and with justified P/B `= (ROE − g)/(Ke − g)`. Inputs: ROE path (default fades from current ROE to Ke over N years), payout ratio, Ke (CAPM with bank beta), g. Use equity-only discounting; **no WACC, no FCFF, no net debt**.
**Worked RI example:** BV_0 = 100, Ke = 12%, ROE = 16% for year 1 → RI_1 = (0.16 − 0.12) × 100 = 4.0; PV = 4.0 / 1.12 = 3.57 (that's one year's contribution; full value sums all years plus terminal).

## 4. Reverse DCF
Solve for the single driver that makes `Intrinsic value/share = Price`:
- Drivers: **revenue CAGR (Years 1–5)**, **terminal operating margin**, or **WACC** (implied discount rate / IRR).
- Method: bracketed **Brent/bisection** root-finding, tolerance `|V(x) − Price| < 0.01 × Price/100`, max 100 iterations, bounds from the hard constraints; if no root in bounds → report "No solution within plausible bounds" with the bounds tried.
- Output sentence (factual): "At ₹X the market is pricing in a 5-year revenue CAGR of Y% given your other assumptions."

## 5. Scenarios
Three scenario objects (Bear/Base/Bull), each with its own `g_1..5`, margins, terminal growth, WACC adjustment (±), sales-to-capital. Output a **probability-weighted value** only if the user sets probabilities (must sum to 100%); default shows the three values and a range bar vs current price. Never auto-assign probabilities. Provide one-click "reset to defaults".

## 6. Sensitivity analysis
Engine function computes grids **by re-running the model** (no approximations):
- Grid A: WACC (±1.0pp in 0.5pp steps → 5) × terminal growth (±1.0pp in 0.5pp steps → 5) → value/share.
- Grid B: terminal margin × revenue CAGR (5 × 5).
- Cells where `WACC ≤ g + 0.5%` show `—` ("invalid").
- Highlight the cell closest to the base case; colour scale neutral→accent by percent difference vs current price (colour + number).

## 7. Worked example (golden test — the engine must reproduce within tolerance)
Inputs (simplified, year-end discounting, no fade, explicit 5 years only): FCFF = 100, 110, 121, 133.1, 146.41; WACC 12%; terminal growth 4%; plain Gordon `TV = FCFF_5 × (1+g)/(WACC − g)`; debt 300, cash 100, minorities 10; shares 100.
- Discount factors: 0.892857, 0.797194, 0.711780, 0.635518, 0.567427.
- PV of explicit flows ≈ **430.77**.
- TV₅ = 146.41 × 1.04 / 0.08 = **1,903.33**; PV(TV) ≈ **1,080.00**.
- EV ≈ **1,510.77**; TV share of EV ≈ 71.5%.
- Equity = 1,510.77 − (300 − 100) − 10 = **1,300.77**; per share ≈ **13.01**.
Tolerance ±0.05 on EV, ±0.01 on per share. Recompute independently in a spreadsheet and commit it as `packages/valuation/__fixtures__/golden-dcf.xlsx`.
Additional golden tests: WACC example above (11.75%); mid-year variant; lease treatment variants; bank RI example; reverse DCF recovering a known growth rate (forward-compute a value from g=8%, then solve → 8.00% ± 0.01pp).

## 8. Property-based tests (fast-check)
- Value decreases monotonically as WACC rises (all else equal).
- Value increases monotonically with terminal growth while `g < WACC`.
- Scaling all cash flows by k scales EV by k.
- Reverse DCF ∘ forward DCF round-trips.
- Currency-mismatched inputs throw.
- Router never sends `bank` to FCFF.

## 9. DCF workspace UI (`/models/dcf/:symbol` and Valuation tab)
Layout: **Summary bar** (Price · Intrinsic value (Base) · Upside/downside · range Bear–Bull, `ESTIMATE` badge) → **Assumptions panel** (grouped: Growth, Margins & reinvestment, WACC, Terminal; each input shows default, source, as-of, and a reset) → **Projection table** (years as columns, with all trace rows, expandable) → **Equity bridge** → **Scenarios** → **Sensitivity grids** → **Reverse DCF** → **Methodology** (formulas as above).
- Inputs validate inline using engine constraints; a changed assumption recomputes instantly client-side (the engine runs in the browser *and* on the server for saved results — identical code, parity test).
- Compare "history vs forecast" mini-charts (revenue, margin, FCFF) so users can sanity-check assumptions.
- Persistent disclaimer under the summary: "Model output is an estimate based on the assumptions shown. It is not investment advice."
- Model refuses and explains for: negative TTM revenue, fewer than 3 years of history (warn), bank in FCFF mode, missing shares.
- "Save analysis" arrives in Phase 18 (design the serialisable `ValuationRun { engineVersion, inputs, outputs, createdAt }` now).

## Do not
Use FCFF for financials; mix currencies; let terminal growth ≥ WACC; hide assumptions or defaults' sources; output a single "fair value" without the range and assumptions.

## Definition of Done
- [ ] Engine passes all golden, property and parity tests; coverage ≥ 95% on `packages/valuation`.
- [ ] Router correctly classifies every seeded instrument (banks → RI model).
- [ ] UI shows full calculation trace, scenarios, sensitivity, reverse DCF.
- [ ] Independent spreadsheet reproduces golden outputs within tolerance.
- [ ] Three real companies valued end-to-end with results reviewed for plausibility and logged in `VALIDATION_LOG.md`.

---
**Next:** `phase-17-peer-comparison.md`
