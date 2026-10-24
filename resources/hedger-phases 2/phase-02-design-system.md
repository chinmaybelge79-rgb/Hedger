# Phase 02 — Design System

**Prerequisite:** Phase 01 complete and merged.
**Progress:** Phase 2 of 20

> **Standing rules (apply to every phase)**
> 1. Complete **only this phase**; do not start the next. Do not mark it done until every item under *Definition of Done* passes, with evidence (test output, screenshots, or logs).
> 2. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI — missing data renders `—` (with reason), not-meaningful renders `NM`.
> 3. Every number carries **currency, unit/scale, as-of date and freshness**. Never mix currencies or substitute look-alike instruments.
> 4. The browser never calls the data provider; secrets stay server-side.
> 5. UI uses Phase 2 tokens and components only. Minimal, white, flat, Inter, tabular numbers.
> 6. If a requirement cannot be met with the available data, **stop and report** instead of approximating or fabricating.

**Goal:** A tiny, strict design system. Minimal, white, spacious, numerically precise. Nothing is styled outside these tokens.

## 1. Principles
1. **Quiet by default.** Colour is reserved for meaning (up/down/warning/accent), never decoration.
2. **Numbers are the hero.** Tabular figures, right-aligned, consistent decimals.
3. **Flat surfaces.** 1 px borders, no heavy shadows, no gradients, no glassmorphism.
4. **Density has two modes:** *Marketing* (spacious) and *Research* (compact, still calm).
5. **Fewer components, used consistently.**

## 2. Tokens (single source: `tokens.css` + Tailwind theme)
```css
:root {
  /* Surfaces */
  --bg: #FFFFFF;
  --bg-subtle: #FAFAFA;      /* table header, hover */
  --border: #E5E5E5;
  --border-strong: #D4D4D4;
  /* Text */
  --text: #111111;
  --text-muted: #737373;
  --text-faint: #A3A3A3;
  /* Semantic */
  --accent: #0A7D4F;         /* restrained financial green: links, focus, primary button */
  --accent-hover: #086A43;
  --up: #0A7D4F;
  --down: #C2362B;
  --warn: #B7791F;
  --info: #2F5D9E;
  /* Shape */
  --radius-sm: 4px; --radius-md: 8px;
  /* Motion */
  --ease: cubic-bezier(.2,.0,.0,1); --dur-fast: 120ms; --dur: 200ms;
}
```
Contrast: `--text-muted` on white = 4.7:1 (passes AA for body). Never use `--text-faint` for essential text.

## 3. Typography
- Font: **Inter** variable, self-hosted via `@fontsource-variable/inter` (no external font CDN). Fallback: `system-ui, -apple-system, "Segoe UI", sans-serif`.
- Numbers: `font-variant-numeric: tabular-nums; font-feature-settings: "tnum","cv11";` on every numeric cell/stat.
| Token | Size/Line | Weight | Use |
|---|---|---|---|
| display | 40/44 | 600 | Landing hero only |
| h1 | 28/34 | 600 | Page titles |
| h2 | 20/28 | 600 | Section titles |
| h3 | 16/24 | 600 | Card titles |
| body | 14/22 | 400 | Default |
| small | 13/20 | 400 | Table cells, captions |
| micro | 12/16 | 500 | Labels, badges, units |
Letter-spacing: `-0.01em` on display/h1; `0` elsewhere.

## 4. Spacing, grid, layout
- 4 px base: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Container: max-width **1280 px**, side padding 24 px (16 px under 640 px).
- 12-column grid, 24 px gutter; Research pages use 16 px gutters.
- Breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`.

## 5. Components to build (and only these)
`Button` (primary/secondary/ghost, sm/md) · `Input` · `Select` · `Tabs` (underline style) · `SegmentedControl` (1D/1W/1M…) · `Card` (border only) · `Stat` (label, value, delta, meta) · `Delta` (▲/▼ + colour + sign; colour never the only cue) · `Badge` (neutral/up/down/warn) · `FreshnessBadge` · `DataTable` · `Tooltip` · `Skeleton` · `EmptyState` · `ErrorState` · `Dialog` · `Toast` · `Kbd`.
Build on shadcn/ui primitives (Radix) then restyle to tokens. Remove every unused shadcn component.

### FreshnessBadge
`LIVE` · `DELAYED 15m` · `END OF DAY · 21 Oct 2026` · `ANNUAL · FY2025` · `CALCULATED` · `SAMPLE DATA`. Micro-text, muted, with tooltip giving source and exact timestamp.

## 6. Number & date formatting library (`@hedger/format`, pure functions, fully unit-tested)
| Function | Rule |
|---|---|
| `formatPrice(m: Money)` | Currency symbol, 2 dp (JPY/KRW 0 dp), locale grouping |
| `formatCompact(m: Money, system)` | `system='indian'` → K / L / Cr / L Cr; `'intl'` → K / M / B / T |
| `formatPercent(x, dp=2, signed)` | `0.0087 → +0.87%`; never multiply twice |
| `formatMultiple(x)` | `24.2x`; negative or undefined → `NM` |
| `formatDelta(abs, pct)` | `+₹12.50 (+0.87%)` |
| `formatDate(d, tz)` | `22 Oct 2026`; times in the **exchange's** timezone with abbreviation |
| `formatMissing(reason)` | `—` plus accessible text describing why |

**Worked examples (must be unit tests):**
- `₹1,45,000.50` is `formatPrice({value:"145000.50", currency:"INR"})` under `en-IN`.
- `19,600,000,000,000 INR` → Indian: `₹19.60 L Cr` · Intl: `₹19.60T`. (1 Cr = 10⁷, 1 L Cr = 10¹².)
- `1,250,000 USD` → `$1.25M`.
- `formatMultiple(-3.2)` → `NM`; `formatMultiple(null)` → `—`.
- Percent: `0.0065` → `+0.65%`; `-0.0015` → `−0.15%` (use true minus sign U+2212).

Default numbering system: Indian for INR instruments, international otherwise; user can override in settings later.

## 7. Charts style (applies in Phase 7 & 11)
No gridline clutter: horizontal hairlines only (`--border`). Line width 1.5 px. Primary series `--text`; comparison series from a fixed 5-colour muted palette (`#111111, #0A7D4F, #2F5D9E, #B7791F, #737373`). Up/down colours only for candles/volume. Crosshair tooltip with date, value, currency.

## 8. Motion & a11y
- Only opacity/translate transitions ≤ 200 ms; respect `prefers-reduced-motion`.
- Visible 2 px focus ring using `--accent`, offset 2 px.
- Touch targets ≥ 40 px on mobile. Colour is never the only carrier of meaning.

## 9. Deliverables
- `/packages/ui` (or `/src/design`) with tokens, components, `@hedger/format`.
- `/design` route (dev only) rendering every component in every state (a lightweight Storybook substitute) — or real Storybook if preferred.
- `DESIGN.md` documenting the above.

## Do not
Add dark mode, extra colours, icon sets beyond one (use `lucide-react`, 1.5 px stroke), or any font other than Inter.

## Definition of Done
- [ ] Tokens are the only source of colour/spacing/type; a lint rule or grep check rejects raw hex outside `tokens.css`.
- [ ] All components render in default/hover/focus/disabled/loading/error states on the design route.
- [ ] Format library has ≥ 40 unit tests including every worked example above.
- [ ] axe reports zero violations on the design route.

---
**Next:** `phase-03-frontend-audit-foundation.md`
