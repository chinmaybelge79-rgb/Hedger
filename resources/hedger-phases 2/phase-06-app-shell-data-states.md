# Phase 06 — Application Shell & Universal Data States

**Prerequisite:** Phase 05 complete and merged.
**Progress:** Phase 6 of 20

> **Standing rules (apply to every phase)**
> 1. Complete **only this phase**; do not start the next. Do not mark it done until every item under *Definition of Done* passes, with evidence (test output, screenshots, or logs).
> 2. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI — missing data renders `—` (with reason), not-meaningful renders `NM`.
> 3. Every number carries **currency, unit/scale, as-of date and freshness**. Never mix currencies or substitute look-alike instruments.
> 4. The browser never calls the data provider; secrets stay server-side.
> 5. UI uses Phase 2 tokens and components only. Minimal, white, flat, Inter, tabular numbers.
> 6. If a requirement cannot be met with the available data, **stop and report** instead of approximating or fabricating.

**Goal:** The layout and the single most important reliability primitive: a `DataState` wrapper that makes it *impossible* to render raw null/undefined data or hide staleness.

## 1. Layout components
- `AppShell`: header (from Phase 5), main container (max 1280 px), footer (compact in app, full on marketing).
- `PageHeader`: h1, optional subtitle, optional right-side actions.
- `Section`: h2 + optional description + `FreshnessBadge` slot + content; 48 px vertical rhythm (32 px in dense mode).
- `Grid`: 12-col responsive helper with named presets (`1/2`, `2/3+1/3`, `1/3×3`).
- `StickySubnav`: for company tabs, sticky under header with 1 px border.

## 2. Global search trigger
Header search is a button styled as an input (`Search companies…  ⌘K`) opening a `Dialog` command palette. Palette content comes in Phase 8; for now render recent pages + empty state.

## 3. `DataState` — the core primitive
```ts
type DataStatus = 'loading' | 'ok' | 'empty' | 'partial' | 'stale' | 'error' | 'unavailable';

<DataState
  query={useQuery(...)}          // TanStack Query result
  skeleton={<TableSkeleton rows={8} />}
  emptyTitle="No financial statements" emptyReason="..."
  staleAfterMs={...}             // otherwise from API meta.freshness
>
  {(data) => <FinancialsTable data={data} />}
</DataState>
```
Rules:
- API envelope is always `{ data, meta: { source, asOf, freshness, currency?, warnings[] } }` (zod-validated). If validation fails → `error` state with a generic message and a logged error id; **no partial render of unvalidated data**.
- `partial`: render data plus a thin warning banner listing missing fields (from `meta.warnings`).
- `stale`: render data plus `STALE · as of …` badge in `--warn`.
- `unavailable`: provider doesn't supply this for this instrument — explain *why* in one line ("Financial statements aren't available for this listing from the current data source.").
- Skeletons match final layout dimensions (no layout shift).
- Retry button on `error`; exponential backoff on automatic retries (max 2).

## 4. `Value` rendering component
Never render numbers via template strings. All numeric UI goes through:
```tsx
<Num kind="price" value={money} />        // price, percent, multiple, compact, ratio, date
```
`Num` accepts `Money | number | null | undefined`, calls `@hedger/format`, and renders `—` with an accessible `title`/`aria-label` for missing values. ESLint rule: forbid `.toFixed(`, `toLocaleString(` and `Intl.NumberFormat` outside `packages/format`.

## 5. Query layer
- TanStack Query with typed hooks per endpoint (`useQuote(id)`, `useFinancials(id, period)`…) in `apps/web/src/api`.
- One `apiClient` (fetch wrapper): base URL, credentials, zod parse, error normalization `{ code, message, requestId }`, request-id header, 8 s timeout, abort on unmount.
- Query keys centralised in `queryKeys.ts`.
- Default `staleTime` by data class: quotes 15 s (client only polls when tab visible), fundamentals 6 h, static 24 h.

## 6. Cross-cutting UI
- `Toast` for user-initiated actions only (save, copy link).
- Global `ErrorBoundary` + per-section boundaries so one failed panel never blanks the page.
- Offline banner via `navigator.onLine`.
- Print stylesheet for company page and DCF (white, no nav).

## 7. Accessibility
Landmarks (`header`, `nav`, `main`, `footer`), skip link, `aria-live="polite"` for async loads, table `scope` attributes, focus restored after dialog close.

## 8. Tests
- `DataState` tested in every status with fixture data.
- Leakage scan: render each status and assert DOM text contains none of `null|undefined|NaN|Infinity|[object Object]`.
- `Num` property test: for random numbers, `null`, `undefined`, `Infinity`, `NaN`, never throws, never prints forbidden tokens.

## Do not
Fetch data inside presentational components; build page content beyond placeholders.

## Definition of Done
- [ ] All pages from Phase 5 mount inside `AppShell` with correct titles.
- [ ] `DataState` and `Num` exist, documented, and used for 100% of numeric display from this phase forward (lint-enforced).
- [ ] Leakage and a11y tests pass in CI.

---
**Next:** `phase-07-markets-dashboard.md`
