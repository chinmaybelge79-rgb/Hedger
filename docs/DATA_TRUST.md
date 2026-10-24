# Data-Trust Principles & Verification Rules — Hedger

Trust is the single most critical asset of any financial research application. An investor who detects a single corrupted metric, mixed currency, or silent default will immediately abandon the tool.

---

## 1. Core Data-Trust Principles (Standing Rules)

1. **Explicit Provenance and Freshness:**
   Every displayed metric must carry its **currency**, **unit/scale**, **as-of date**, and **freshness class** (`LIVE`, `DELAYED 15m`, `END OF DAY`, `HISTORICAL`, or `CALCULATED`).

2. **Missing is Not Zero:**
   A missing or unrecorded metric must **never** be rendered as `0`, `0.00`, or an empty space. Missing values must render as `—` with an accessible tooltip or disclosure explaining why the field is unavailable (e.g., *"Issuer does not report this line item"*).
   `null`, `undefined`, `NaN`, `Infinity`, and raw `[object Object]` must **never** reach the UI layer.

3. **No Instrument or Currency Substitution:**
   Never substitute a similarly named instrument (e.g. trading ADR `TTM` instead of domestic share `TATAMOTORS.NS`).
   Never perform silent currency conversions without explicit labeling of exchange rate, date, and source.

4. **Not Meaningful is Not Missing:**
   Financial metrics that are mathematically invalid or economically nonsensical (such as a Price-to-Earnings ratio for a company with negative net income, or Debt/Equity for a company with negative book value) must render as **`NM`** (Not Meaningful), never as negative multiples, zero, or `—`.

5. **Distinguish Reported vs. Calculated Figures:**
   Directly reported line items (from SEC 10-K/10-Q or MCA/SEBI financial filings) must be visually distinct from derived metrics (e.g., Free Cash Flow, Invested Capital, Return on Capital Employed).

6. **Valuation Output Framing:**
   All valuation calculations must be explicitly presented as **estimates dependent on user-auditable assumptions**, never as definitive financial advice or price guarantees.

7. **Sector-Appropriate Valuation Models:**
   Valuation models must match business reality. Specifically:
   **Commercial banks, NBFCs, and insurance institutions must never be subjected to FCFF (Free Cash Flow to Firm) DCF models**, because interest income is operational revenue and debt constitutes raw operating inventory. Such firms are routed to Excess Returns / Dividend Discount / P/B-ROE models.

---

## 2. Rendering Comparison Matrix (Correct vs. Incorrect)

| Scenario | ❌ Incorrect Rendering (Banned) | ✅ Correct Rendering (Hedger Standard) | Rationale |
|---|---|---|---|
| **Missing Operating Cash Flow** | `$0` or `0.00` or blank | `—` *(Tooltip: Not reported by issuer for FY2021)* | Zero implies zero cash generated; `—` accurately conveys absence of data. |
| **Negative Net Income P/E** | `-14.2x` or `0.0x` | `NM` *(Tooltip: Not Meaningful due to negative net income)* | Negative P/E has no economic meaning in valuation multiples. |
| **Large Indian Rupee Market Cap** | `₹19600000000000` or `$235B` | `₹19.60 L Cr` *(with option for ₹19.60T Intl)* | Indian market participants expect Lakh Crore (`L Cr`); currency must remain INR. |
| **USD Market Cap** | `1250000000 USD` | `$1.25B` | Standard clean international compact representation with dollar sign. |
| **Price Delta** | `+12.5 (1.4%)` (in black) | `+₹12.50 (+1.40%)` (with ▲ and `--up` colour) | Full signed price delta, currency, 2 decimal places, and directional symbol for a11y. |
| **Down Price Delta** | `-0.85%` (using ASCII hyphen) | `−0.85%` (using true minus U+2212, ▼, `--down` colour) | Typographical precision and accessible colour cues. |
| **Stale Market Price** | Showing price with no timestamp | `₹2,940.50` with badge `DELAYED 15m · As of 15:30 IST` | Prevents user from mistaking delayed or closed market data for real-time order books. |
| **Bank Valuation** | Applying WACC and Capex to HDFC Bank | Banner: *"Financial Firm: Evaluated via Excess Return / P/B model"* | Financial firms cannot calculate FCFF due to regulatory capital and deposit liabilities. |
| **Data Fetch Error** | White screen or `Cannot read property 'c' of undefined` | Clean `<ErrorState>` with retry button and error code | Resilient UI architecture gracefully isolates failures. |

---

## 3. Data Integrity Invariant Tests

The system enforces automated property tests:
1. **Market Cap Invariant:**
   $$\text{Market Cap} = \text{Current Price} \times \text{Shares Outstanding}$$
   A divergence exceeding $2.0\%$ triggers an immediate warning badge and internal data audit log.
2. **Strict Currency Isolation:**
   Attempting to add or compare two `Money` types with different currency strings (e.g. `Money("100", "USD") + Money("100", "INR")`) throws a runtime exception and is caught in TypeScript compilation.
3. **Leakage Regex Scanner:**
   All rendered HTML and serialized API payloads are scanned for the regex:
   `/\b(null|undefined|NaN|Infinity|\[object Object\])\b/i`. Any match fails the build and pipeline.
