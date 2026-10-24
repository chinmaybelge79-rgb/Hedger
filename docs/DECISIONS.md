# Architectural Decision Records (ADR) — Hedger

---

## ADR-001: Monorepo Structure & Core Stack Choice

- **Status:** Accepted
- **Context:** Hedger requires high numerical accuracy, shared TypeScript types across client and server, a Python integration for yfinance, and strict component design tokens.
- **Decision:** Use a **pnpm monorepo** layout:
  - `apps/web`: React + TypeScript + Vite + Tailwind CSS.
  - `apps/api`: Node.js + Express + TypeScript.
  - `packages/ui`: Design system tokens (`tokens.css`) and atomic components.
  - `packages/format`: Pure numeric, currency, date, and unit formatting library.
  - `packages/types`: Shared zod schemas and TypeScript DTOs.
  - `packages/valuation`: Pure, auditable valuation and DCF engine.
  - `services/yf-gateway`: Private Python (FastAPI/uvicorn) microservice encapsulating `yfinance`.
- **Consequences:**
  - Strict type consistency between backend API responses and frontend renderers via shared zod schemas.
  - Fast local development with Vite HMR and pnpm symlinks.

---

## ADR-002: Multi-Provider Market Data Architecture

- **Status:** Accepted
- **Context:** Free API plans have varied regional coverage and rate limits:
  - Alpha Vantage: strict 25 calls/day, 5 calls/min limit.
  - Finnhub: 60 calls/min, US equity coverage, company news, and standardized US fundamentals.
  - yfinance (Python): comprehensive global coverage (India NSE/BSE, Europe, US, APAC), statement history, historical OHLCV bars.
- **Decision:**
  - Build a unified `MarketDataService` with a `ProviderRouter` and `QuotaBudgeter`.
  - **Routing:**
    - US market quotes/profiles/news: Finnhub as primary.
    - Indian (NSE/BSE) & Global quotes, historical bars, and financial statements: yfinance via `yf-gateway`.
    - Alpha Vantage: **Strictly excluded from user request paths**; reserved solely for background spot-checks and reconciliation.
  - **Quota Control:** Token buckets enforce rate limits; requests coalesce to avoid redundant upstream calls.
  - **Single Provenance:** Never splice financial statements or price series across different providers for the same instrument.
- **Consequences:**
  - Prevents quota exhaustion on free tiers.
  - Enables seamless plug-and-play addition of commercial feeds (e.g. Polygon, FactSet, Bloomberg) in the future without frontend rewrites.

---

## ADR-003: Design System & Minimalist Theme

- **Status:** Accepted
- **Context:** Financial applications often suffer from visual noise, dark mode glare, inconsistent number alignment, and unnecessary decorative gradients.
- **Decision:**
  - Implement a clean, minimal, white, flat aesthetic:
    - Background: `--bg: #FFFFFF`, `--bg-subtle: #FAFAFA`.
    - Borders: 1px flat `--border: #E5E5E5`.
    - Accent: Restrained financial green (`#0A7D4F`).
    - Negative: `#C2362B`.
  - Typography: **Inter** variable with tabular numbers (`tabular-nums`) on all numeric data.
  - Dark mode and neon gradients are excluded to maintain clean editorial clarity.
- **Consequences:**
  - Maximum legibility, fast rendering, and high information density without user fatigue.

---

## ADR-004: Pure Client-Side Dynamic Valuation Engine

- **Status:** Accepted
- **Context:** Users testing DCF assumptions (WACC, terminal growth, revenue CAGR) require instantaneous feedback without round-trip network delays.
- **Decision:**
  - Package DCF calculations as pure functional mathematics in `packages/valuation`.
  - Initial baseline inputs are loaded from the API; all subsequent slider and input adjustments evaluate purely in-memory in the browser (< 5ms).
  - Persistence of custom models is executed on explicit "Save Analysis" actions.
- **Consequences:**
  - Zero server compute overhead during interactive scenario modeling; ultra-responsive user experience.

---

## ADR-005: Security, Browser Isolation & Zero Secrets Leakage

- **Status:** Accepted
- **Context:** API keys (Finnhub, Alpha Vantage) must never be exposed to client bundles or browser network tabs.
- **Decision:**
  - The browser **never** calls third-party providers directly. All market data requests route through `/api/*`.
  - Secrets are validated at server startup using zod. If a required secret is missing or misformatted, the backend process fails fast.
  - CI verification scans frontend production bundles to ensure no secret key strings or tokens are bundled.
- **Consequences:**
  - Full API key security and centralized caching/throttling.
