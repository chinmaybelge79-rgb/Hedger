# Hedger Frontend

Institutional-grade valuation platform frontend built with React 18, TypeScript, Vite, and Tailwind CSS.

## Design System

This frontend maintains **pixel-perfect parity** with the original Hedger design:

- **Colors**: Paper (#FFFFFF), Ink (#0A0A0A), Graphite (#4A4A4A), Ash (#8A8A8A), Hairline (#E4E4E4), Fog (#F7F7F7)
- **Dark Mode**: Complete inversion with proper contrast ratios
- **Typography**: Open Sans with precise letter-spacing, line-height, and text-transform rules
- **Spacing**: Consistent 8px base unit, responsive gutters (96px/48px/24px)
- **Border Radius**: 2px (cards/buttons), 11px (toggles), 12px (dialogs)
- **Transitions**: 80ms (fast), 140ms (normal), 200ms (slow)

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Routing**: React Router v6
- **State**: Zustand (UI state) + TanStack Query (server state)
- **Styling**: Tailwind CSS v3 (design tokens as config)
- **Charts**: Recharts (SVG-based, theme-aware)
- **Icons**: Lucide React
- **Forms**: Native HTML + controlled components
- **Testing**: Vitest + React Testing Library

## Project Structure

```
frontend-react/
├── public/                 # Static assets
├── src/
│   ├── api/               # API client & types
│   │   ├── client.ts      # Fetch wrapper with error handling
│   │   ├── endpoints.ts   # Centralized endpoint definitions
│   │   └── types.ts       # TypeScript interfaces for all models
│   ├── components/
│   │   ├── ui/            # Design system primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Kbd.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   └── Dropdown.tsx
│   │   ├── layout/        # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── CommandPalette.tsx
│   │   └── charts/        # Chart components (future)
│   ├── hooks/             # Custom React hooks
│   │   ├── useTheme.ts    # Dark/reading mode
│   │   ├── useSearch.ts   # Command palette state
│   │   ├── useCompanies.ts # Company/financial data
│   │   └── useValuation.ts # Valuation models
│   ├── pages/             # Route-level components
│   │   ├── HomePage.tsx
│   │   ├── ModelsPage.tsx
│   │   ├── PricingPage.tsx
│   │   ├── TickerPage.tsx
│   │   ├── FinancialsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── AboutPage.tsx
│   ├── lib/               # Utilities
│   │   ├── design-tokens.ts
│   │   └── utils.ts
│   ├── App.tsx            # Root component with routing
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles + Tailwind
├── tailwind.config.js     # Design tokens as Tailwind config
├── vite.config.ts         # Vite + proxy config
├── vitest.config.ts       # Test config
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- Backend running on `http://localhost:3000` (see backend README)

### Installation

```bash
cd frontend-react
npm install
```

### Development

```bash
npm run dev
# Opens http://localhost:5173
# Proxies /api/* to http://localhost:3000
```

### Build for Production

```bash
npm run build
# Outputs to dist/
```

### Run Tests

```bash
npm run test
# or
npm run test:watch
```

### Type Check

```bash
npm run typecheck
```

## API Integration

All backend endpoints are typed and accessible via hooks:

```typescript
// Company data
const { data: profile } = useCompanyProfile('AAPL');
const { data: financials } = useFinancials('AAPL', 'annual', 5);
const { data: market } = useMarketData('AAPL');

// Valuation models (mutations)
const dcfMutation = useDcf('AAPL');
const result = await dcfMutation.mutateAsync({
  forecastYears: 5,
  revenueGrowth: [0.08, 0.07, 0.06, 0.05, 0.04],
  ebitMargin: [0.31, 0.32, 0.32, 0.33, 0.33],
  taxRate: 0.21,
  wacc: 0.087,
  terminalGrowth: 0.025,
});

// Analytics
const { data: risk } = useRisk('AAPL');
const { data: confidence } = useConfidence('AAPL');
const sensitivity = useSensitivity('AAPL');
```

## Available Models (30+)

| Category | Models |
|----------|--------|
| **Core** | DCF, Reverse DCF, WACC |
| **Relative** | Comps, SOTP |
| **Income** | DDM (Gordon/2-Stage/3-Stage), Residual Income, EVA |
| **Analytics** | Sensitivity, Scenarios, Monte Carlo, Risk, Confidence |
| **Summary** | Multi-model consensus |

Each model has:
- Input validation (Zod schemas shared with backend)
- Loading/error states
- Real-time data fetching with caching
- Export-ready results

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home with hero, model strip, search |
| `/models` | Model gallery with uniform cards |
| `/pricing` | Three-tier pricing with toggle |
| `/ticker/:ticker` | Full workspace: chart, models, risk, confidence |
| `/financials/:ticker` | Tabbed financial statements |
| `/settings` | Appearance, account |
| `/about` | Philosophy, models, disclaimer |

## Command Palette (⌘K)

Global search with:
- Fuzzy ticker/name matching
- Keyboard navigation (↑/↓/Enter/Escape)
- Recent/frequent suggestions
- Opens from header or home search bar

## Theming

```css
/* Light (default) */
:root {
  --paper: #FFFFFF;
  --ink: #0A0A0A;
  --graphite: #4A4A4A;
  --ash: #8A8A8A;
  --hairline: #E4E4E4;
  --fog: #F7F7F7;
}

/* Dark mode */
.dark {
  --paper: #0A0A0A;
  --ink: #F0F0F0;
  --graphite: #B0B0B0;
  --ash: #6A6A6A;
  --hairline: #2A2A2A;
  --fog: #141414;
}

/* Reading mode */
.reading-mode {
  --paper: #f5f0e8;
  --ink: #3d3426;
  --graphite: #5d5242;
  --ash: #8d7d6a;
  --hairline: #d4c4a8;
  --fog: #ebe0cf;
}
```

Toggle via Header profile menu or Settings page.

## Accessibility (WCAG 2.1 AA)

- Semantic HTML5 structure
- Focus-visible outlines (2px ink)
- ARIA labels/roles on all interactive elements
- Keyboard navigation for all components
- Color contrast ratios ≥ 4.5:1
- Reduced motion support
- Screen reader announcements for dynamic content

## Performance

- Code-splitting by route (`React.lazy`)
- Vendor chunk splitting (react, charts, ui)
- TanStack Query caching (stale-while-revalidate)
- Lazy-loaded images
- Minimal CSS (Tailwind purge)
- Production bundle: ~150KB gzipped

## Deployment

```bash
npm run build
# Deploy dist/ to Vercel, Netlify, Cloudflare Pages, etc.
# Ensure backend CORS allows your domain
```

## Backend Contract

This frontend expects the backend at `/api/v1` with these contracts:

```
GET  /health                    # Health check
GET  /search?q=                 # Search tickers
GET  /companies/:ticker         # Company profile
GET  /market/:ticker            # Market data + history
GET  /financials/:ticker        # Financial statements
GET  /valuation/:ticker/wacc    # WACC components
POST /valuation/:ticker/dcf     # DCF valuation
POST /valuation/:ticker/reverse-dcf
POST /valuation/:ticker/comps
POST /valuation/:ticker/sotp
POST /valuation/:ticker/ddm
POST /valuation/:ticker/residual-income
POST /valuation/:ticker/eva
GET  /valuation/:ticker/summary # Consensus
POST /valuation/:ticker/dcf/sensitivity
POST /valuation/:ticker/scenarios
POST /valuation/:ticker/monte-carlo
GET  /valuation/:ticker/risk
GET  /valuation/:ticker/confidence
```

## Contributing

1. Follow the existing code style (ESLint + Prettier)
2. Add tests for new components (`__tests__/`)
3. Update types when backend contracts change
4. Maintain design system parity

## License

Proprietary — Hedger Research LLC