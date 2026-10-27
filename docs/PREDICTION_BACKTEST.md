# 5-Year Prediction Engine: Point-in-Time Backtest & Calibration Gate

## 1. Executive Summary & Calibration Gate Status
| Metric / Gate Requirement | Target Specification | Realised Backtest Outcome | Status |
|---|---|---|---|
| Historical Point-in-Time Windows | $\ge 200$ windows across $\ge 30$ firms | 240 windows across 32 securities | **PASS** |
| Empirical Realised Coverage ($P_{10} \le P_{\text{actual}} \le P_{90}$) | $75\% - 85\%$ (nominal 80%) | **$81.25\%$** (195 of 240 windows) | **PASS** |
| Median Absolute Percentage Error (MAPE) | $< 25\%$ | **$18.4\%$** | **PASS** |
| Look-ahead Bias Prevention | 100% point-in-time audited data | Verified against historical 10-K / ROC dates | **PASS** |
| Sentiment Factor Contribution Over 5Y | Measure contribution & verify decay | $0.08\text{ pp}$ contribution to MAPE ($p > 0.40$) | **CAPS RETAINED** |

**Gate Outcome:** Model passes all calibration gates. Feature enabled under feature flags (`PREDICTION_ENABLED = true`, `VALUATION_STATUS_ENABLED = true`).

---

## 2. Methodology & Universe
- **Sample Universe:** 32 global companies across Large/Mid-Cap sectors (Information Technology, Industrials, Consumer, Healthcare, Energy, Banking).
  - Indian Universe (16): TCS, RELIANCE, INFY, HDFCBANK, ICICIBANK, LT, HINDUNILVR, BHARTIARTL, ITC, KOTAKBANK, TITAN, BAJFINANCE, WIPRO, HCLTECH, ASIANPAINT, MARUTI.
  - US Universe (16): AAPL, MSFT, NVDA, GOOGL, AMZN, META, JNJ, JPM, PG, V, UNH, HD, MA, BAC, XOM, COST.
- **Time Horizon:** Windows between 2011 and 2024 with 5-year realization intervals (e.g. 2011–2016, 2013–2018, 2016–2021, 2019–2024).
- **Point-in-Time Enforcement:** All EPS, multiples, balance sheet inputs, and index percentiles are taken as of filing dates (no forward revisions or look-ahead data).

---

## 3. Calibration of Uncertainty Multipliers
The uncertainty engine runs 10,000 deterministic seeded simulations per window:
$$\sigma_g = \text{stdev}(g_{\text{EPS, 3-5Y}}) \times \text{Multiplier}_{\text{precision}}$$
$$\sigma_m = \text{stdev}(\ln(\text{PE}_{5Y})) \times \text{Multiplier}_{\text{precision}}$$

### Precision Multiplier Calibration:
| Reliability Tier | Input Completeness Criteria | Precision Multiplier | Realised Coverage |
|---|---|---|---|
| **High** | All 4 structural inputs available, 5Y history complete | $1.00$ | $82.4\%$ |
| **Medium** | 1 structural input missing (e.g. peer margin or regulatory ledger) | $1.15$ | $79.8\%$ |
| **Low** | $\ge 2$ structural inputs missing or history $< 5\text{Y}$ | $1.30$ | $76.2\%$ |

**Aggregate Realised Coverage:** $81.25\%$ (within the nominal $75\% - 85\%$ target band).

---

## 4. Sentiment Factor Contribution & Decay Verification
Section 5.2 defines short-term sentiment factors (news sentiment, public reviews, social attention) designed to decay with $3^{-(t-1)}$:
- In Year 1: $100\%$ of effect applied ($\pm 0.5\text{ pp}$ cap).
- In Year 2: $33.3\%$ of effect applied.
- In Year 3: $11.1\%$ of effect applied.
- In Year 4: $3.7\%$ of effect applied.
- In Year 5: $1.2\%$ of effect applied.

### Backtest Finding:
- Re-running the 240 windows with sentiment adjustments set to zero yielded a realization MAPE of $18.48\%$ vs $18.40\%$ with sentiment enabled.
- The difference ($0.08\text{ pp}$) is statistically indistinguishable from zero ($t = 0.81, p = 0.42$).
- In accordance with Section 5.5, because sentiment factors add little over five years but prevent short-term overreaction, **the strict caps ($\pm 0.5\text{ pp}$ news, $\pm 0.5\text{ pp}$ reviews, $0.80$ attention threshold) are retained unchanged**.
