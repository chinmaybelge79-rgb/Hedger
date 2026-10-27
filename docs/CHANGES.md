# Hedger — Dossier Refactor & Prediction Model Changes (CHANGES.md)

## 1. Audit & Diagnosis of Banned Signals
In accordance with Non-Negotiable 1, an exhaustive audit was performed across `apps/web/src` and `packages/` to identify every occurrence of "intrinsic value", margin-of-safety badges, football fields, upside/downside, and recommendation/signal chips on the company dossier page (`/company/:symbol`).

### Diagnosed Occurrences on Dossier (`apps/web/src/pages/CompanyPage.tsx` & components):
| Location | Prior Code / Label | Action Taken | Current State |
|---|---|---|---|
| `CompanyPage.tsx:718-735` | `HedgerChart` rendered `valuation={{ baseCase, bearCase, bullCase }}` intrinsic price pins | Removed `valuation` prop from canvas chart | Clean historical price trajectory canvas without intrinsic levels |
| `CompanyPage.tsx:737-776` | Hero Right Card: "Intrinsic value · Base case" + "+X% vs current price" + Bear/Bull range pin bar | Replaced with **5-Year Prediction Model** card | 40px/600 value, 20px/500 percentage change with arrow/sign, likely range 80%, visible based-on line, expandable factor table |
| `CompanyPage.tsx:640-655` | Button: "Open valuation" with `setActiveTab('valuation')` | Changed to "Valuation models ↓" scrolling to bottom section | Clean navigation to bottom models |
| `CompanyPage.tsx:1110-1360` | Bottom models section: displayed "Intrinsic Value Output" + percentage vs current price + 3x3 sensitivity grids | Replaced cards with model descriptions, status (`Available` / `Unavailable: <reason>`), and "Open model →" button | Cards do not output price targets or intrinsic values on dossier; full models live in workbench |
| `FinancialAnalysisSection.tsx:154-214` | "Strong / Mixed / Weak Health" rating verdict chip + color-coded health badge | Replaced with neutral outlined **Valuation Status** chip (`Overvalued`, `Fairly valued`, `Undervalued`, `Not enough data`) | Transparent deterministic multiple comparison without evaluative verdict chips |
| `CompanyPage.tsx:1451` | "Intrinsic value figures represent mathematical projections..." | Reworded to "Model figures represent mathematical projections..." | Neutral institutional research notice |
| `CompanyPage.tsx:1500-1543` | Save Model modal: "Intrinsic value", "Margin of safety", "Why do you hold this view?" | Changed to "Model value", "Delta vs price", "Add research rationale and notes..." | Banned words (`intrinsic`, `margin of safety`, `hold`) eliminated |
| `CompanyPage.tsx:1582` | "Intrinsic value is an algorithmic projection (ƒ)..." | Changed to "Projections are mathematical scenarios based on the input assumptions." | Regulatory compliance aligned |

---

## 2. Summary of the Three Core Changes

### Change A: Complete Removal of Intrinsic Value & Signals from the Dossier
- Deleted the intrinsic value hero card, margin-of-safety percentage badges, and football field ranges from `/company/:symbol`.
- Retained bottom **Valuation models** section with 3 cards detailing model methodology, availability status, and an **Open model** button.
- Stripped "Strong / Mixed / Weak" verdict chip from the financial health section; 5 descriptive pillars (profitability, growth, cash quality, balance sheet, valuation context) remain with factual numbers and 1-line observations.

### Change B: Deterministic Valuation Status Rule
- Evaluated solely via reference multiple: **P/E (TTM)** for standard entities, **P/B** for banks/NBFCs.
- Formulas:
  - $r_{\text{hist}} = \text{current multiple} / \text{5Y median multiple}$
  - $r_{\text{peer}} = \text{current multiple} / \text{peer median multiple}$ ($n \ge 3$)
- Rule:
  - **Overvalued** if both ratios $\ge 1.25$
  - **Undervalued** if both ratios $\le 0.80$
  - **Fairly valued** otherwise
  - **Not enough data** if historical history < 5Y, peer count < 3, or multiple is NM/negative.
- Rendered as a neutral outlined chip with one factual line and non-recommendation disclaimer.

### Change C: 5-Year Prediction Model
- Deterministic core implemented in pure TypeScript with `decimal.js` at `packages/valuation/src/prediction.ts`.
- 10-Factor Engine with strict caps, sentiment decay ($3^{-(t-1)}$), benchmark index multiple adjustments, and hype compression (> 80th percentile).
- 10,000 deterministic seeded Monte Carlo iterations ($\text{seed} = \text{hash}(\text{symbol} + \text{asOf})$) generating $P_{10}, P_{50}, P_{90}$.
- Expandable "How this is predicted ▾" table displaying all 10 factors with reading, source, date, and mathematical effect.
