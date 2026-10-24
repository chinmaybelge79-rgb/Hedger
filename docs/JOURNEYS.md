# User Journeys & Acceptance Criteria — Hedger

This document defines the 7 core user journeys (J1–J7) and establishes concrete, verifiable acceptance criteria for each step.

---

## J1: Discover (Instrument Search & Switch)
**Goal:** A user searches for an equity instrument and transitions seamlessly to its detailed company research page.

### Flow & Acceptance Criteria:
1. **Trigger Search:**
   - User clicks search input or hits shortcut `Cmd+K` (or `Ctrl+K`).
   - Modal/palette opens instantly (< 50ms) with keyboard focus inside input.
2. **Input Query:**
   - User types "reliance", "apple", or ticker "TCS".
   - Search debounces at 200ms before sending query to `/api/instruments/search?q=...`.
3. **Display Results:**
   - Matching instruments display ticker, company legal name, exchange (`NSE`, `BSE`, `NASDAQ`, `NYSE`), sector, and trading currency (`INR`, `USD`, `EUR`).
   - If no exact hit, display clean empty state: "No instruments found matching '{query}'".
4. **Select & Navigate:**
   - User presses `Enter` or clicks item.
   - Route navigates to `/company/{symbol}` (e.g. `/company/RELIANCE.NS`).
   - Page loads within 2.5s (LCP). Header displays official name, ticker, exchange tag, live/EOD price, change delta, and freshness badge.

---

## J2: Understand (Financial Statements & Historicals)
**Goal:** An investor inspects multi-year reported financial performance across Income Statement, Balance Sheet, and Cash Flow.

### Flow & Acceptance Criteria:
1. **Navigate to Statements:**
   - User clicks the **Financials** tab on `/company/{symbol}`.
   - UI presents sub-tabs: Income Statement, Balance Sheet, Cash Flow.
2. **Period Toggle:**
   - User can switch between **Annual** (minimum 5 years where data is available) and **Quarterly** (minimum 4 recent quarters).
3. **Data Integrity & Consistency:**
   - Every column clearly displays the reporting fiscal year/date (e.g. `FY2024 (Mar 2024)` or `Q2 2025`).
   - Currency is prominently displayed above table (e.g. `All figures in ₹ Crores (INR)` or `All figures in $ Millions (USD)`).
   - Missing rows/cells display `—` with an explainer tooltip on hover (e.g. "Data item not reported by issuer").
   - `null`, `undefined`, `NaN`, `Infinity` are 100% barred from appearing in DOM text.
4. **Calculated vs. Reported Distinction:**
   - Derived rows (e.g. Gross Margin %, Operating Margin %, Free Cash Flow) are visibly designated with subtle mathematical indicators.

---

## J3: Value (DCF & Valuation Engine)
**Goal:** An investor audits or customizes an intrinsic valuation model.

### Flow & Acceptance Criteria:
1. **Open Valuation Tab:**
   - User navigates to `/company/{symbol}#valuation`.
   - Engine identifies company sector:
     - If non-financial: loads FCFF Discounted Cash Flow model.
     - If financial (Bank/NBFC/Insurance): loads Dividend Discount / Excess Returns / P/B-ROE model with explicit notice: *"Banks and financial institutions are evaluated using an Equity/Excess Return framework rather than FCFF DCF due to debt functioning as operating inventory."*
2. **Scenario Cards (Base / Bull / Bear):**
   - Displays 3 distinct cards showing calculated intrinsic value per share vs. current market price.
   - Shows margin of safety delta (e.g. `+18.4% Undervalued` in green or `-12.1% Overvalued` in down colour).
3. **Editable Assumptions:**
   - User can slide or type new parameters:
     - WACC / Cost of Capital (%)
     - Terminal Growth Rate ($g$) (%)
     - 5-year Revenue CAGR (%)
     - Target Operating Margin (%)
     - Effective Tax Rate (%)
   - Model recalculates in pure client memory instantly (< 5ms) without page reloads or server latency.
4. **Sensitivity Matrix:**
   - 2D grid displays intrinsic value varying across WACC (Y-axis: $\pm 0.5\%$, $\pm 1.0\%$) and Terminal Growth Rate (X-axis: $\pm 0.5\%$, $\pm 1.0\%$).
   - Current selected combination is distinctly highlighted.

---

## J4: Compare (Peer Comps Table)
**Goal:** Benchmark a target company against key competitors in the same industry.

### Flow & Acceptance Criteria:
1. **Navigate to Peers:**
   - User clicks **Peers** tab.
   - Pre-populated peer list loads based on industry classification (e.g. `TCS.NS`, `INFY.NS`, `WIPRO.NS`).
2. **Interactive Benchmark Management:**
   - User can remove a peer with one click.
   - User can add a custom peer via quick symbol search.
3. **Multiples & Summary Stats:**
   - Table columns: Ticker, Name, Market Cap, P/E, EV/EBITDA, P/B, EV/Sales, ROE %, Operating Margin %.
   - Summary rows calculate **Peer Median** and **Peer Average** (excluding non-meaningful `NM` values).
   - Shows **Implied Target Price** based on median P/E and EV/EBITDA compared with target's actual price.

---

## J5: Screen (Multi-Metric Stock Screener)
**Goal:** Discover equities matching specific financial criteria without data errors.

### Flow & Acceptance Criteria:
1. **Open Screener:**
   - User visits `/screener`.
   - Default preset filters are available (e.g. "High ROE Compounders", "Value with Low Debt", "Large Cap Tech").
2. **Filter Controls:**
   - User selects Market/Region: India (NSE/BSE), US, Global.
   - User configures numeric range sliders/inputs:
     - Minimum / Maximum Market Cap
     - P/E range (with option to filter out `NM` loss-makers)
     - Minimum ROE %
     - Maximum Debt/Equity
3. **Results Execution:**
   - Table updates with matching stocks showing clean pagination.
   - All columns sortable ascending/descending.
   - Clicking a ticker links directly to its Company dossier.

---

## J6: Save (Saved Analyses & Watchlists)
**Goal:** Save custom valuation assumptions and access them later across sessions.

### Flow & Acceptance Criteria:
1. **Authentication:**
   - User signs in via email/password.
   - Session cookie is stored securely (`HttpOnly; Secure; SameSite=Lax`).
2. **Save Valuation:**
   - On the valuation screen, user clicks "Save Model".
   - Optional name and notes modal appears.
   - Snapshot stores symbol, price at valuation, timestamp, and the exact set of modified assumption variables.
3. **Recall Analysis:**
   - User opens `/saved` or `/watchlist`.
   - Saved valuations list shows instrument, date saved, valuation at save time vs. current live price.
   - Clicking re-opens the valuation tool pre-loaded with exact saved numbers.

---

## J7: Markets (Macro & Indices Overview)
**Goal:** High-level market pulse and sector performance check.

### Flow & Acceptance Criteria:
1. **Open Markets Dashboard:**
   - User visits `/markets`.
2. **Index Bar:**
   - Shows NIFTY 50, SENSEX, S&P 500, NASDAQ, with current level, day's points change, and percentage delta.
3. **Market Breadth & Movers:**
   - Shows advances vs. declines ratio.
   - Top gainers and top losers tables with volume and percentage move.
4. **Freshness & Provenance:**
   - Explicit badge renders timestamp of last update, market status (Open / Closed / Pre-market), and data source.
