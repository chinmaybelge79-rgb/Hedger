# Frontend Audit & Foundation Report — Hedger

## 1. Inventory & Historical Assessment
- **Status of Legacy Codebase:** Clean slate. The Hedger workspace was initialized empty.
- **Components to Port:** 0 legacy components.
- **Recommendation:** Stand up a fresh, strictly typed pnpm monorepo conforming 100% to Phase 02 design tokens, `@hedger/format`, shared Zod schemas, and standard React 19 + TypeScript + Vite.

## 2. Monorepo Architecture
```
hedger/
  apps/
    web/            # React + TypeScript + Vite + Tailwind (Phase 2 tokens)
    api/            # Node.js + Express + TypeScript
  packages/
    ui/             # Component design system based on strict CSS tokens
    format/         # Pure formatting library (Money, Indian Lakh/Crore, Intl, dates)
    types/          # Shared Zod schemas and TypeScript interfaces
    valuation/      # Pure DCF, reverse DCF, and sensitivity calculations
  services/
    yf-gateway/     # Python FastAPI microservice wrapping yfinance
  docs/             # Architectural records, data-trust policies, and journey specs
```

## 3. Strict Linting & Data Integrity Guardrails
- `null`, `undefined`, `NaN`, `Infinity` barred from client UI rendering.
- All numbers strongly formatted with explicit currency, scale, and freshness.
- Secrets completely confined to server-side environments.
