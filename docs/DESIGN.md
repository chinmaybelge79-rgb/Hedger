# Design System Specifications — Hedger

---

## 1. Principles
1. **Quiet by Default:** Colour is reserved exclusively for semantic meaning (`--up`, `--down`, `--warn`, `--accent`), never for pure decoration.
2. **Numbers are the Hero:** Tabular figures (`tnum`, `font-variant-numeric: tabular-nums`), right-aligned by default with consistent precision.
3. **Flat Surfaces:** 1px borders (`#E5E5E5`), zero heavy drop shadows, no neon gradients, no glassmorphism.
4. **Density Modes:** Marketing (spacious) and Research (compact, quiet density).

---

## 2. Core Tokens (`tokens.css`)

```css
:root {
  /* Surfaces */
  --bg: #FFFFFF;
  --bg-subtle: #FAFAFA;      /* table header, hover states */
  --border: #E5E5E5;
  --border-strong: #D4D4D4;

  /* Text */
  --text: #111111;
  --text-muted: #737373;
  --text-faint: #A3A3A3;

  /* Semantic */
  --accent: #0A7D4F;         /* restrained financial green */
  --accent-hover: #086A43;
  --up: #0A7D4F;
  --down: #C2362B;
  --warn: #B7791F;
  --info: #2F5D9E;

  /* Shape */
  --radius-sm: 4px;
  --radius-md: 8px;

  /* Motion */
  --ease: cubic-bezier(.2,.0,.0,1);
  --dur-fast: 120ms;
  --dur: 200ms;
}
```

---

## 3. Strict Typography

- Font family: Inter (fallback: `system-ui, -apple-system, sans-serif`).
- Numbers: `font-variant-numeric: tabular-nums; font-feature-settings: "tnum", "cv11";` on all quantitative elements.
- Letter spacing: `-0.01em` on page headings, `0` on tabular and body copy.

---

## 4. Components Specification
- **Button:** `primary`, `secondary`, `ghost` (sizes: `sm`, `md`).
- **Input & Select:** Flat 1px border with `--accent` focus ring.
- **Tabs:** Underline style with active indicator in `--accent`.
- **SegmentedControl:** Grouped pill toggle (1D, 5D, 1M, 6M, YTD, 1Y, 5Y, MAX).
- **Card:** Flat 1px border with optional subtle background.
- **Delta:** Signed with directional indicator (▲/▼) + colour + percentage. Accessible to screen readers.
- **FreshnessBadge:** Micro-tag denoting exact timestamp and data freshness (`LIVE`, `DELAYED`, `EOD`, `ANNUAL`, `CALCULATED`).
- **DataTable:** Responsive, sortable financial table with tabular alignment and empty state fallbacks.
