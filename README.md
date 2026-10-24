# Hedger — Minimalist Equity Research & Valuation Platform

Hedger is a high-accuracy, minimalist equity research and intrinsic valuation platform tailored for Indian (NSE/BSE) and global equities (US, Europe, Asia-Pacific).

Designed with flat surfaces, 1px borders, high-density tabular typography, and zero data leaks.

---

## ⚡ Core Functionalities & Features

### 1. Global & Domestic Instrument Discovery (`Cmd+K`)
- **Instant Search:** Multi-region search supporting NSE, BSE, NASDAQ, NYSE, and European bourses.
- **Rich Instrument Identifiers:** Direct lookup by symbol, company name, exchange prefix, and ticker (`RELIANCE.NS`, `AAPL`, `MSFT`, etc.).
- **Smart Keyboard Navigation:** Fully accessible with quick shortcut overlays.

### 2. Deep Financial Statements & Audited History
- **5+ Years of Audited Statements:** Normalized Income Statement, Balance Sheet, and Cash Flow Statement.
- **Reporting Period Toggles:** Instant switching between **Annual** and **Quarterly** filings.
- **Indian & International Units:** Automatic and contextual unit formatting (₹ Lakh / ₹ Crore for Indian equities, Million / Billion for global).
- **Data Provenance & Freshness:** Explicit timestamp badges, data source references, and zero silent failures (`null`/`NaN` guarded).

### 3. Valuation & Scenario Engine
- **Discounted Cash Flow (FCFF DCF):** Dynamic multi-stage DCF model with automated Base, Bull, and Bear cases.
- **Interactive Sensitivity Sliders:** Instant (<5ms) client-side recomputation for:
  - WACC (Weighted Average Cost of Capital)
  - Terminal Growth Rate ($g$)
  - Revenue CAGR trajectories & Operating Margins
- **2D Sensitivity Matrix:** Real-time matrix mapping varying WACC vs. Terminal Growth assumptions against implied share prices.
- **Reverse DCF:** Reverse-engineers what growth rate and cash flows the current market price is pricing in.
- **Sector-Specific Models:** Auto-detection for Financial Institutions (Banks/NBFCs) routing to Excess Returns / P/B-ROE models rather than free cash flow models.

### 4. Peer Benchmarking & Comparable Multiples
- **Sector Comps:** Pre-configured and customizable comparable peer lists across industry sectors.
- **Valuation Multiples:** Real-time computation of P/E, P/B, EV/EBITDA, EV/Sales, FCF Yield, ROE, and ROCE.
- **Implied Valuation:** Computes sector median and average multiples to derive implied market prices against current trading values.

### 5. Multi-Metric Stock Screener
- **Custom Filters:** Filter by Exchange, Region, P/E ratio, ROE, Debt-to-Equity, Market Cap, and Operating Margins.
- **Pre-set Screens:** One-click screening for Value, High Growth, Quality Compounders, and Dividend Yield.
- **Sortable High-Density Grids:** Direct click-through links to full company dossiers.

### 6. Macro & Markets Dashboard
- **Index Watch:** Real-time coverage across benchmark indices (Nifty 50, Sensex, S&P 500, Nasdaq 100).
- **Market Breadth & Movers:** Top gainers, losers, 52-week highs/lows, and sector heatmaps.
- **Commodities & Rates:** Tracking key macro drivers (Crude Oil, Gold, Silver, 10Y Sovereign Yields).

### 7. User Accounts & Saved Models
- **Snapshot Persistence:** Save custom valuation runs with full parameter audit trails (timestamp, inputs, and spot price).
- **Watchlists:** Track personal baskets of equities across global exchanges.
- **Zero Data Drift:** Saved analyses reload with identical historical assumptions.

---

## 🏛 Architecture & Tech Stack

```
hedger/
├── apps/
│   ├── web/               # React 19 + TypeScript + Vite + Tailwind CSS
│   └── api/               # Node.js + Express + TypeScript Market Data Service
├── packages/
│   ├── ui/                # Strict design system tokens (tokens.css) & atomic components
│   ├── format/            # Pure formatting library (Indian Lakh/Crore, Intl, Currency math)
│   ├── types/             # Shared Zod schemas & TypeScript DTOs
│   └── valuation/         # Pure FCFF DCF, Reverse DCF, Scenarios & Sensitivity Engine
├── services/
│   └── yf_gateway/        # Python (FastAPI/uvicorn) microservice wrapping yfinance
└── docs/                  # Architecture Decision Records, Data Trust, and Phase Specs
```

---

## 🔑 Data Provider Architecture

Hedger unifies all external data behind a secure server-side `MarketDataService` layer:
1. **yfinance Python Gateway (`services/yf_gateway`):** Powers Indian (NSE/BSE) equities, global historical daily bars, and multi-year financial statements.
2. **Finnhub Adapter (`apps/api`):** Real-time US quotes, company profiles, and market news.
3. **Alpha Vantage Adapter (`apps/api`):** Reserved for spot-checks and secondary verification.

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- pnpm >= 8
- Python 3.10+

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Services

**Option A — Run all concurrently:**
```bash
pnpm dev:all
```

**Option B — Run services individually:**

1. Python Gateway (Port 8001):
```bash
python3 -m uvicorn services.yf_gateway.main:app --port 8001
```

2. Backend API (Port 3001):
```bash
pnpm --filter @hedger/api dev
```

3. Web App (Port 5173):
```bash
pnpm --filter @hedger/web dev
```

Open **`http://localhost:5173`** in your browser.

---

## 🧪 Testing & Validation

```bash
# Run unit & valuation monotonicity tests
pnpm test

# Typecheck monorepo
pnpm typecheck

# Production build
pnpm build
```

---

## 📜 License
Private & Proprietary. All rights reserved.
