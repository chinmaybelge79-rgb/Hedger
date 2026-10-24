# Product Definition — Hedger

## 1. Product Statement
Hedger is a minimalist equity research and valuation platform for Indian and global listed companies. It is guided by four primary jobs, in order of priority:
**Discover → Understand → Compare → Value**

Anything that does not directly serve one of these four jobs is strictly out of scope for v1.

---

## 2. Primary Users

| User Persona | Core Need | Success Metric |
|---|---|---|
| **Self-directed Retail Investor (India-first)** | Understand a company and sanity-check its market price | Finds an instrument (e.g. `RELIANCE.NS`), reviews financial statements, and sees a transparent, assumption-driven valuation in under 3 minutes. |
| **Finance Student / Financial Analyst** | Learn and audit real-world valuation mechanics | Can view every underlying variable (WACC, terminal growth, operating margins), adjust assumptions dynamically, and inspect mathematical lineage. |
| **Equity Researcher** | Rapidly screen and benchmark comparable peers | Obtains a defensible, currency-consistent peer valuation multiple table in under 1 minute. |

---

## 3. Core User Journeys (Acceptance Scenarios)

1. **J1 Discover (Instrument Search & Switch):**
   - User types "reliance" or "AAPL" into the global search bar (`Cmd+K`).
   - Clean dropdown renders exact matching instruments with exchange (`NSE`, `NASDAQ`), currency (`INR`, `USD`), and identifier.
   - User selects `RELIANCE.NS` → navigates to `/company/RELIANCE.NS`.

2. **J2 Understand (Financial Statements & Historicals):**
   - User opens the **Financials** tab on a company page.
   - Toggles between **Annual** and **Quarterly** reporting periods.
   - Views 5+ years of Income Statement, Balance Sheet, and Cash Flow Statement with standard line items, fiscal year-end labels, units (e.g. `₹ Cr` or `$M`), and source provenance.

3. **J3 Value (DCF & Valuation Engine):**
   - User opens the **Valuation** tab.
   - Automatically sees Base, Bull, and Bear DCF intrinsic value scenarios.
   - Can inspect and modify key levers: WACC, Terminal Growth Rate ($g$), Revenue Growth, and Margin trajectories.
   - UI displays Price vs. Intrinsic Value delta with a 2D sensitivity matrix.
   - Financial sector companies (Banks, NBFCs, Insurers) are routed away from FCFF DCF to Excess Returns / P/B-ROE models with clear rationale.

4. **J4 Compare (Peer Comps Table):**
   - User navigates to the **Peers** tab.
   - Default sector peers are pre-populated; user can add or remove peers.
   - Median and average valuation multiples (P/E, EV/EBITDA, P/B, EV/Sales) are computed across active peers.
   - Implied valuation is derived and displayed alongside actual trading price.

5. **J5 Screen (Multi-Metric Stock Screener):**
   - User navigates to `/screener`.
   - Filters by Region/Exchange (e.g. India / NSE) + Financial Filters (e.g. ROE > 15%, P/E < 25, Debt/Equity < 1.0).
   - Generates tabular, sortable results with zero missing-data crashes (`—` with explanation).
   - Click-through links direct straight to individual company dossiers.

6. **J6 Save (Reproducible Saved Valuations & Watchlists):**
   - Authenticated user adjusts DCF assumptions and clicks "Save Analysis".
   - Analysis saves with exact snapshot of market price, timestamp, and assumption parameters.
   - User re-opens saved analysis from `/saved` at any time; original assumptions load identically without data drift.

7. **J7 Markets (Macro & Markets Dashboard):**
   - User opens `/markets`.
   - Inspects index strip (Nifty 50, Sensex, S&P 500, Nasdaq 100), market breadth (advances/declines), top movers, and key benchmark yield rates.
   - Every metric carries an explicit freshness badge (`LIVE`, `DELAYED 15m`, `END OF DAY`).

---

## 4. Scope Boundary

### In Scope for v1:
- Global & Indian instrument search with exchange metadata.
- Company Overview dossier (business summary, key metrics, shareholding if available).
- Interactive historical price chart (1D, 5D, 1M, 6M, YTD, 1Y, 5Y, MAX) with volume.
- Standardized Financial Statements (Income Statement, Balance Sheet, Cash Flow).
- Core Valuation Ratios (P/E, P/B, EV/EBITDA, EV/Sales, FCF Yield, ROE, ROCE).
- Stock Screener with preset and customizable filters.
- Valuation Engine: Discounted Cash Flow (DCF), Reverse DCF, Scenario analysis (Base/Bull/Bear), and Sensitivity Grid.
- Peer Comparison table with sector medians and implied multiples.
- Markets overview dashboard.
- User accounts (session-based, argon2id password hashing), watchlists, and saved valuation models.
- Company news feed (when supported by server-side provider).

### Out of Scope for v1 (Explicitly Deferred):
- Portfolio tracking and transaction sync.
- Options, futures, derivatives, and Greeks modeling.
- Complex multi-window draggable desktop layouts.
- Real-time low-latency tick streaming / Level 2 order book.
- Broad macroeconomic database beyond key benchmark rates.
- Public social/community feeds and chat rooms.
- Billing, subscription tiers, and payment processing (all features completely accessible in v1).

---

## 5. Target Coverage Universe

Hedger guarantees full end-to-end data pipeline validation for an initial target universe across four major regions:

- **India (NSE):**
  - Reliance Industries (`RELIANCE.NS`)
  - Tata Consultancy Services (`TCS.NS`)
  - HDFC Bank (`HDFCBANK.NS`)
  - ICICI Bank (`ICICIBANK.NS`)
  - State Bank of India (`SBIN.NS`)
  - Infosys (`INFY.NS`)
  - Wipro (`WIPRO.NS`)
  - Hindustan Unilever (`HINDUNILVR.NS`)
  - ITC (`ITC.NS`)
  - Tata Motors (`TATAMOTORS.NS`)
  - Mahindra & Mahindra (`M&M.NS`)
  - Larsen & Toubro (`LT.NS`)
  - Sun Pharmaceutical (`SUNPHARMA.NS`)
  - Dr. Reddy's Laboratories (`DRREDDY.NS`)
  - Bharti Airtel (`BHARTIARTL.NS`)
  - Oil and Natural Gas Corporation (`ONGC.NS`)

- **United States (NASDAQ / NYSE):**
  - Apple Inc. (`AAPL`)
  - Microsoft Corporation (`MSFT`)
  - NVIDIA Corporation (`NVDA`)
  - Amazon.com Inc. (`AMZN`)
  - Alphabet Inc. (`GOOGL`)
  - Meta Platforms Inc. (`META`)
  - Berkshire Hathaway Inc. (`BRK-B`)
  - JPMorgan Chase & Co. (`JPM`)
  - Walmart Inc. (`WMT`)
  - Exxon Mobil Corporation (`XOM`)

- **Europe (AMS, XETRA, LSE, OMX):**
  - ASML Holding (`ASML.AS`)
  - SAP SE (`SAP.DE`)
  - Novo Nordisk (`NOVO-B.CO`)
  - LVMH (`MC.PA`)
  - Shell plc (`SHEL.L`)
  - HSBC Holdings (`HSBA.L`)
  - Siemens AG (`SIE.DE`)

- **Asia-Pacific (TSE, HKEX, ASX):**
  - Toyota Motor Corp (`7203.T`)
  - Sony Group Corp (`6758.T`)
  - Samsung Electronics (`005930.KS`)
  - Taiwan Semiconductor Manufacturing Co. (`TSM`)
  - Tencent Holdings (`0700.HK`)
  - Alibaba Group (`BABA`)
  - BHP Group (`BHP.AX`)
