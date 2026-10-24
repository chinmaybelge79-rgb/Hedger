# Hedger — Minimalist Equity Research & Valuation Platform

Hedger is a high-accuracy, minimalist equity research and intrinsic valuation platform for Indian and global equities.

Built strictly according to the 20-phase architecture specification with flat surfaces, 1px borders, Inter typography, tabular numbers, and zero data leaks.

---

## 🏛 Architecture & Tech Stack

```
hedger/
├── apps/
│   ├── web/               # React 19 + TypeScript + Vite + Tailwind CSS
│   └── api/               # Node.js + Express + TypeScript Market Data Service
├── packages/
│   ├── ui/                # Strict design system tokens (tokens.css) & atomic components
│   ├── format/            # Pure formatting library (Indian Lakh/Crore, Intl, Money math)
│   ├── types/             # Shared Zod schemas & TypeScript DTOs
│   └── valuation/         # Pure FCFF DCF, Reverse DCF, Scenarios & Sensitivity Engine
├── services/
│   └── yf_gateway/        # Python (FastAPI/uvicorn) microservice wrapping yfinance
├── docs/                  # Architecture Decision Records, Data Trust, and Phase Specs
└── resources/             # Phase prompts and official project SVG logos
```

---

## 🔑 Data Provider Integration

All third-party data providers are strictly unified behind the server-side `MarketDataService`. The browser **never** calls providers directly and keys are completely secured on the server:

1. **Finnhub (`apps/api/src/providers/FinnhubAdapter.ts`):**
   - Active Key: `dbcuf89r01qioilbkb50dbcuf89r01qioilbkb5g`
   - Role: US equities real-time quotes, company profile, and financial news.
2. **Alpha Vantage (`apps/api/src/providers/AlphaVantageAdapter.ts`):**
   - Active Key: `CDEA1P2G2SXPT8DU`
   - Role: Preserved strictly for background spot-checks and reconciliation (blocked from user-facing request paths to conserve free quota).
3. **yfinance Python Gateway (`services/yf_gateway/main.py`):**
   - Python FastAPI service running on port `8001` with shared secret authorization.
   - Powers Indian (NSE/BSE) equities, global historical daily bars (1M, 6M, 1Y, 5Y), and multi-year financial statements.

---

## 🚀 Quick Start (Running Hedger)

Hedger runs in three cooperating services:

### 1. Start the Python yfinance Gateway (Port 8001):
```bash
python3 -m uvicorn services.yf_gateway.main:app --port 8001
```

### 2. Start the Backend API (Port 3001):
```bash
pnpm --filter @hedger/api dev
```

### 3. Start the Web Frontend (Port 5173):
```bash
pnpm --filter @hedger/web dev
```

Or run all concurrently:
```bash
pnpm dev:all
```

Open **`http://localhost:5173`** in your browser to experience Hedger!

---

## 🧪 Testing & Validation

Run all unit tests, DCF monotonicity tests, and data-trust invariant checks:
```bash
pnpm test
```

Typecheck the entire monorepo:
```bash
pnpm typecheck
```

Build production distribution:
```bash
pnpm build
```

---

## 🧭 Four Core Investor Jobs

- **Discover:** Instant `Cmd+K` global search across NSE, BSE, NASDAQ, and NYSE equities.
- **Understand:** 5+ years of audited Income Statements, Balance Sheets, and Cash Flows with zero `null`/`NaN` rendering.
- **Value:** Interactive Base, Bull, and Bear DCF intrinsic valuations with dynamic WACC and terminal growth sliders (<5ms recomputation), 2D sensitivity matrix, and reverse DCF.
- **Compare:** Comprehensive peer benchmark multiples with sector median implied valuations.
