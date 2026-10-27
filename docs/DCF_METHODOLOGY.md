# Hedger DCF Valuation Engine — Institutional Methodology & Governance

## 1. Executive Summary & Foundational Principles
The Hedger Valuation Engine provides institutional-grade valuation workbenches computing **intrinsic value per share** from verified financial statements, audited filings, and user-editable operating assumptions.

The engine is built on four non-negotiable architectural invariants:
1. **Mathematical Purity & Precision**: The core engine in `packages/valuation` operates with zero I/O, no system clock, and no stochastic elements, executing all numerical computations using `decimal.js` arbitrary precision arithmetic (40 decimal digits, half-even Banker's rounding). The identical engine executes in browser client sessions and server environments, verified by automated parity tests.
2. **Provenance & Zero Guesswork**: Every default assumption is deterministically derived from canonical normalized financial statements with recorded source, reporting period, filing date, and a one-click reset to default. If essential filing data is absent, the model explicitly declares `Unavailable: <reason>` rather than fabricating inputs.
3. **Currency Discipline**: Cash flows, risk-free discount rates, debt/bridge obligations, and per-share results strictly share one currency end-to-end. INR cash flows are evaluated against the Reserve Bank of India 10-Year G-Sec sovereign benchmark; USD flows against the US 10-Year Treasury yield.
4. **Company-Type Routing Guardrail**: General non-financial firms evaluate through the 10-Year Free Cash Flow to Firm (FCFF) DCF framework. Banking, NBFC, and insurance institutions are strictly routed to the Clean Surplus Residual Income Model with a Dividend Discount Model (DDM) cross-check. Financial institutions are blocked from FCFF DCF by hard invariant validation.

---

## 2. FCFF Valuation Architecture (General Corporations)

```
Historical Financials (10-K / 10-Q / Audited P&L)
                     │
                     ▼
  ┌────────────────────────────────────────────────────────┐
  │ 10-Year Projection Engine                              │
  │ • Years 1–5: Explicit User Path                        │
  │ • Years 6–10: Linear Fade to Terminal Equilibrium      │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │ Operating Cash Flow (FCFF) Formula                     │
  │   Revenue_t  = Revenue_{t-1} × (1 + g_t)               │
  │   EBIT_t     = Revenue_t × Margin_t                    │
  │   NOPAT_t    = EBIT_t × (1 − Tax_t)                    │
  │   Reinvest_t = (Revenue_t − Revenue_{t-1}) ÷ S2C       │
  │   FCFF_t     = NOPAT_t − Reinvest_t                    │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │ Discounting Engine (WACC)                              │
  │ • Year-End:  DF_t = 1 ÷ (1 + WACC)^t                   │
  │ • Mid-Year:  DF_t = 1 ÷ (1 + WACC)^(t − 0.5)           │
  │   EV_mid = EV_end × (1 + WACC)^0.5                     │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │ Terminal Value (TV) Formulation                        │
  │ • Value-Driver (Default):                              │
  │   FCFF_{N+1} = NOPAT_N × (1+g) × (1 − g ÷ ROIC_T)      │
  │   TV = FCFF_{N+1} ÷ (WACC − g)                         │
  │ • Plain Gordon: FCFF_N × (1+g) ÷ (WACC − g)            │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │ Institutional Equity Bridge & Per-Share Value          │
  │   Enterprise Value (EV) = Σ PV(FCFF) + PV(TV)          │
  │   Equity = EV − Debt − Leases* − Pref − Minorities     │
  │            + Cash + Non-Operating Assets               │
  │   Value Per Share = Equity ÷ Diluted Shares Outstanding│
  └────────────────────────────────────────────────────────┘
```

### 2.1 Multi-Phase Projection Horizon
- **Phase 1: Explicit Horizon (Years 1–5)**:
  - Guided by near-term revenue growth $g_1$, fading linearly to year 5 midpoint $g_5 = (g_1 + g_{\text{terminal}}) / 2$.
  - Operating EBIT margin converges linearly from current TTM margin $m_0$ to target margin $m_5$ by Year 5.
  - Cash tax rate applies explicit cash tax rate fading toward statutory marginal rate.
- **Phase 2: Terminal Convergence Fade (Years 6–10)**:
  - Growth, margin, and tax rate fade linearly:
    $$\theta_t = \theta_5 + (\theta_{\text{terminal}} - \theta_5) \times \frac{t - 5}{5}, \quad \text{for } t \in [6, 10]$$
  - At Year 10, the company operates precisely at steady-state terminal parameters ($g_{\text{terminal}}$, $m_{\text{terminal}}$, $\text{tax}_{\text{statutory}}$).

### 2.2 Reinvestment & Capital Intensity
Rather than forecasting arbitrary Depreciation vs CapEx vs Working Capital line items that create balance sheet drift over 10-year periods, the engine applies the **Sales-to-Capital ratio** ($S2C = \Delta\text{Revenue} / \Delta\text{InvestedCapital}$):
$$\text{Reinvestment}_t = \frac{\text{Revenue}_t - \text{Revenue}_{t-1}}{\text{SalesToCapital}}$$
$$\text{FCFF}_t = \text{NOPAT}_t - \text{Reinvestment}_t$$

### 2.3 Value-Driver Terminal Value
Under the value-driver formulation, growth beyond Year 10 requires incremental capital investment determined by the perpetual Return on Invested Capital ($\text{ROIC}_{\text{terminal}}$):
$$\text{Reinvestment Rate}_{\text{terminal}} = \frac{g}{\text{ROIC}_{\text{terminal}}}$$
$$\text{FCFF}_{N+1} = \text{NOPAT}_N \times (1 + g) \times \left(1 - \frac{g}{\text{ROIC}_{\text{terminal}}}\right)$$
$$\text{Terminal Value} = \frac{\text{FCFF}_{N+1}}{\text{WACC} - g}$$

**Key Economic Theorem**: When $\text{ROIC}_{\text{terminal}} = \text{WACC}$, the reinvestment rate exactly offsets the growth benefit:
$$\text{TV} = \frac{\text{NOPAT}_N \times (1 + g) \times (1 - g/\text{WACC})}{\text{WACC} - g} = \frac{\text{NOPAT}_{N+1} \times (\text{WACC} - g)}{\text{WACC} \times (\text{WACC} - g)} = \frac{\text{NOPAT}_{N+1}}{\text{WACC}}$$
Growth adds zero economic surplus value above cost of capital.

---

## 3. Cost of Capital (WACC) Building Blocks

### 3.1 Cost of Equity ($K_e$) via Capital Asset Pricing Model
$$K_e = R_f + \beta_{\text{Blume}} \times \text{ERP}$$
- **Risk-Free Rate ($R_f$)**: Matched strictly to cash flow currency:
  - India (INR): Reserve Bank of India 10-Year Benchmark G-Sec Yield (7.05%).
  - United States (USD): US Department of the Treasury 10-Year Benchmark Yield (4.35%).
- **Blume Mean-Reverting Beta**:
  $$\beta_{\text{Blume}} = 0.67 \times \beta_{\text{raw}} + 0.33$$
  Corrects for empirical regression toward market mean over institutional horizons.
- **Equity Risk Premium (ERP)**:
  - India: 5.50% (Damodaran country risk-adjusted).
  - United States: 5.00% (Mature market ERP).

### 3.2 Weighted Average Cost of Capital (WACC)
$$\text{WACC} = \left(\frac{E}{D+E}\right) \times K_e + \left(\frac{D}{D+E}\right) \times K_d \times (1 - t)$$
where $K_d$ is the pre-tax cost of corporate debt, and $t$ is the marginal corporate tax rate.

---

## 4. Financial Institutions (Banks, NBFCs, Insurers)

### 4.1 Invariant Routing Guardrail
In banking and financial institutions, deposits and borrowings do not represent leverage financing capital; they represent raw inventory and operating working capital. Consequently:
- Free Cash Flow to Firm (FCFF) cannot be defined.
- Debt cannot be subtracted in an equity bridge.
- Enterprise Value (EV) and WACC are mathematically invalid.

### 4.2 Clean Surplus Residual Income Model
Equity intrinsic value is computed directly from Beginning Book Value plus discounted economic profits:
$$\text{Residual Income}_t = (\text{ROE}_t - K_e) \times \text{BV}_{t-1}$$
$$\text{Book Value}_t = \text{BV}_{t-1} + \text{Net Income}_t - \text{Dividends}_t$$
$$\text{Equity Value} = \text{BV}_0 + \sum_{t=1}^{10} \frac{\text{RI}_t}{(1 + K_e)^t} + \text{PV}(\text{Terminal Value})$$

### 4.3 Ohlson Terminal Persistence Parameter ($\omega$)
Rather than assuming perpetual abnormal returns, terminal residual income fades with persistence factor $\omega \in [0, 1]$:
$$\text{TV}_N = \frac{\omega \times \text{RI}_N}{1 + K_e - \omega}$$
$$\text{PV}(\text{TV}) = \frac{\text{TV}_N}{(1 + K_e)^N}$$

### 4.4 Gordon Dividend Discount Model (DDM) Cross-Check
$$\text{Value}_{\text{DDM}} = \frac{\text{DPS}_1}{K_e - g_{\text{DDM}}}$$
where $\text{DPS}_1 = \text{EPS}_1 \times \text{Payout Ratio}$.

---

## 5. Analytical Tools & Governance

### 5.1 5×5 Sensitivity Grid
Re-runs the complete pure DCF calculation across 25 independent permutations:
- $\text{WACC} \in [\text{WACC}_{\text{base}} - 1.0\text{ pp}, \text{WACC}_{\text{base}} + 1.0\text{ pp}]$ in 0.5 pp steps.
- $g \in [g_{\text{base}} - 1.0\text{ pp}, g_{\text{base}} + 1.0\text{ pp}]$ in 0.5 pp steps.
- Invalid combinations ($\text{WACC} \le g + 0.5\text{ pp}$) evaluate to `null` and render as `—`.

### 5.2 Reverse DCF
Applies bracketed bisection root-finding to solve for the exact uniform driver equating intrinsic value to live market price:
$$\text{IntrinsicValuePerShare}(\theta^*) = P_{\text{market}}$$
Drivers supported: flat 5-year growth, uniform operating margin, or WACC. If market price is mathematically unreachable within plausible economic bounds, the model outputs `"No solution within plausible bounds"`.

### 5.3 Statutory Disclaimer & Banned Terms
- Every output, table, and summary card displays the mandatory label:
  **"Estimate based on the assumptions shown. Not investment advice."**
- Banned terms (`buy`, `sell`, `hold`, `target price`, `recommend`) are strictly prohibited throughout all user-facing valuation pages.
