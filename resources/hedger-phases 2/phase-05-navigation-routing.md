# Phase 05 — Navigation & Routing

**Prerequisite:** Phase 04 complete and merged.
**Progress:** Phase 5 of 20

> **Standing rules (apply to every phase)**
> 1. Complete **only this phase**; do not start the next. Do not mark it done until every item under *Definition of Done* passes, with evidence (test output, screenshots, or logs).
> 2. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI — missing data renders `—` (with reason), not-meaningful renders `NM`.
> 3. Every number carries **currency, unit/scale, as-of date and freshness**. Never mix currencies or substitute look-alike instruments.
> 4. The browser never calls the data provider; secrets stay server-side.
> 5. UI uses Phase 2 tokens and components only. Minimal, white, flat, Inter, tabular numbers.
> 6. If a requirement cannot be met with the available data, **stop and report** instead of approximating or fabricating.

**Goal:** A small, predictable URL scheme with validated parameters, shareable state in the URL, and graceful handling of unknown or ambiguous symbols.

## 1. Route table (React Router, lazy-loaded per route)
| Route | Page | Auth |
|---|---|---|
| `/` | Landing | — |
| `/markets` | Global overview (default region tabs) | — |
| `/markets/india` · `/markets/us` · `/markets/europe` · `/markets/asia` · `/markets/commodities` | Region views (same page component, region param) | — |
| `/company/:symbol` | Company research (tabs via query) | — |
| `/screener` | Screener | — |
| `/models` | Models hub | — |
| `/models/dcf/:symbol` | DCF workspace | — (saving requires auth) |
| `/investment-thesis` | Thesis library (v1: placeholder with explicit "Coming soon") | — |
| `/news` | Market news | — |
| `/community` | Placeholder | — |
| `/about` · `/pricing` · `/terms` · `/privacy` · `/disclaimer` | Static | — |
| `/login` · `/signup` · `/forgot-password` | Auth | guest-only |
| `/profile` · `/saved-analysis` | Account | required |
| `*` | 404 | — |
The prompt's `/markets/global` is replaced with `/markets/europe` and `/markets/asia` for clarity; `/markets/global` redirects to `/markets`.

## 2. Symbol handling
- Canonical URL symbol = **provider-independent Hedger symbol**, URL-encoded: `RELIANCE.NS`, `AAPL`, `BRK-B`, `7203.T`, `005930.KS`. Resolution to `instrumentId` happens in the API (Phase 8/10).
- Validate with `^[A-Z0-9][A-Z0-9.\-^=]{0,19}$` (case-insensitive; redirect to uppercase).
- Ambiguous input (e.g. `/company/RELIANCE`): API returns candidates → show a **disambiguation page** (list of listings with exchange, currency). Never guess silently.
- Unknown symbol → friendly not-found state with search box (HTTP 404 from API, not a blank page).

## 3. URL state (shareable, back-button friendly)
| Page | Query params |
|---|---|
| Company | `tab=overview\|financials\|valuation\|charts\|peers\|news`, `range=1Y`, `period=annual\|quarterly`, `statement=income\|balance\|cashflow`, `ccy=` (display currency, later) |
| Screener | `m=IN&x=NSE&s=...&f=roe:gt:15;pe:lt:25&sort=marketCap:desc&p=1` |
| Markets | `range=1M&cmp=NIFTY50,SP500` |
Use a typed helper (`useUrlState(schema)` with zod) — invalid params fall back to defaults and are rewritten with `replace`, not `push`.

## 4. Navigation components
- **Top nav (app + marketing share it):** HEDGER · Models · Markets · Investment Thesis · Community & News · About; right side: Search (⌘K / `/`), Sign In, Get Started (or account menu when signed in).
- No dropdown mega-menus. Region switching lives *inside* Markets as tabs.
- Active item: `--text` with 2 px bottom accent; inactive `--text-muted`.
- Company tabs are an underline `Tabs` component bound to `?tab=`.

## 5. Guards & behaviour
- `RequireAuth` redirects to `/login?next=<path>`; after login return to `next` (validate `next` is a same-origin path to prevent open redirects).
- Scroll restoration: top on route change, preserved on back.
- Route-level `ErrorBoundary` with `ErrorState`; per-route `<title>` and meta via a small `usePageMeta` hook.
- Prefetch the company route chunk when hovering a search result.

## 6. Keyboard
`/` or `⌘K`/`Ctrl+K` opens search; `Esc` closes; `g m` → Markets, `g s` → Screener (optional, behind a flag).

## 7. Tests
- Route table snapshot test (all routes resolve; unauthenticated routes redirect).
- Param validation tests: `reliance`, `RELIANCE.NS`, `<script>`, 50-char string, `BRK-B`, `7203.T`.
- Open-redirect test: `next=https://evil.com` must be ignored.

## Do not
Create per-metric routes, nested route trees deeper than two levels, or client-only symbol guessing.

## Definition of Done
- [ ] Every route renders a real page or an explicit "coming in Phase N" state hidden in production via flag.
- [ ] Deep links with query params restore exact UI state on reload.
- [ ] Back/forward behaves correctly across tab and range changes.
- [ ] Tests above pass.

---
**Next:** `phase-06-app-shell-data-states.md`
