# Phase 12 — Company Page: Header & Overview

**Prerequisite:** Phase 11 complete and merged.
**Progress:** Phase 12 of 20

> **Standing rules (apply to every phase)**
> 1. Complete **only this phase**; do not start the next. Do not mark it done until every item under *Definition of Done* passes, with evidence (test output, screenshots, or logs).
> 2. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI — missing data renders `—` (with reason), not-meaningful renders `NM`.
> 3. Every number carries **currency, unit/scale, as-of date and freshness**. Never mix currencies or substitute look-alike instruments.
> 4. The browser never calls the data provider; secrets stay server-side.
> 5. UI uses Phase 2 tokens and components only. Minimal, white, flat, Inter, tabular numbers.
> 6. If a requirement cannot be met with the available data, **stop and report** instead of approximating or fabricating.

**Goal:** The company page foundation (header, tabs, Overview) with correct, well-defined headline metrics.

## 1. Company header (sticky on scroll, compact variant)
```
Reliance Industries Limited                          ☆ Save   + Watchlist
RELIANCE.NS · NSE · INR                              [Other listings ▾]
₹xx,xxx.xx   +₹x.xx (+x.xx%)     DELAYED 15m · 22 Oct 2026 15:30 IST
Market cap   Enterprise value   P/E (TTM)   P/B   Dividend yield
```
All values illustrative until wired. Requirements:
- Price, change, change %, exchange, currency, freshness badge, market-status dot.
- "Other listings" menu: sibling instruments of the same `Issuer` (NSE/BSE, ADR) — each shows its own currency; navigation never changes currency silently.
- Save/Watchlist buttons are present but require auth (Phase 18); logged-out shows sign-in prompt.
- Tabs (URL-bound): **Overview · Financials · Valuation · Charts · Peers · News**.

## 2. Endpoints
`GET /api/v1/instruments/:id/overview` returns profile, latest quote, key stats, headline financial summary (latest FY + TTM), price performance table, and `meta.warnings`. One composed endpoint avoids waterfalls; internal calls are parallel with per-section failure isolation (`partial` responses).

## 3. Overview contents (top → bottom)
1. **Key stats grid** (4 × 2 `Stat`s): Market cap, EV, P/E (TTM), P/B, EV/EBITDA, Dividend yield, 52W range (with position bar), Beta (if provided).
2. **Mini price chart** (Phase 11 `PriceChart`, 1Y default) + performance table.
3. **Business:** description (collapsed to 4 lines + "More"), sector, industry, HQ city/country, employees, website, fiscal year-end month, listing exchange(s), ISIN.
4. **Financial snapshot:** revenue, EBITDA, net income, EPS for the last 5 fiscal years (small bar charts, annual) + TTM column; margins (gross, EBITDA, operating, net).
5. **Returns & balance sheet:** ROE, ROIC, debt/equity, net debt, cash, interest coverage, current ratio.
6. **Recent developments:** latest 3–5 news items (if provider supports) else section hidden — no placeholders pretending to be news.

## 4. Metric definitions (documented in an in-app "Definitions" popover per metric and in `docs/METRICS.md`)
Using canonical items from Phase 10; averages are the mean of beginning and ending balances for the period.
| Metric | Formula |
|---|---|
| Market cap | `price × shares outstanding` (quote currency) |
| Enterprise value | `Market cap + total debt (incl. leases if reported as debt) + preferred + minority interest − cash & short-term investments` |
| Gross margin | `Gross profit / Revenue` |
| EBITDA margin | `EBITDA / Revenue` |
| Operating margin | `EBIT / Revenue` |
| Net margin | `Net income / Revenue` |
| ROE | `Net income to common (TTM) / average common equity` |
| ROA | `Net income / average total assets` |
| ROIC | `NOPAT / average invested capital`; `NOPAT = EBIT × (1 − t)`; `Invested capital = total debt + total equity − cash & equivalents` |
| Tax rate `t` | `income tax / pretax income` if pretax > 0 and 0 ≤ rate ≤ 50%; else statutory fallback (India 25.17%, US 21% federal + state ≈ 25%) flagged `ASSUMED_TAX_RATE` |
| Net debt | `Total debt − cash & short-term investments` |
| Debt/equity | `Total debt / total equity` (NM if equity ≤ 0) |
| Interest coverage | `EBIT / interest expense` (NM if interest = 0) |
| Current ratio | `Current assets / current liabilities` |
| Dividend yield | `Trailing 12M dividends per share / price` (same currency) |
| Revenue growth | `Rev_t / Rev_{t−1} − 1` (NM if prior ≤ 0) |
**Worked example (tests):** Revenue 1,000, EBIT 150, tax rate 25%, debt 400, equity 600, cash 100 → NOPAT 112.5, invested capital 900, ROIC = 12.5%. Beginning IC 800 & ending 900 → average 850 → ROIC 13.24%.
Banks/NBFCs/insurers: hide EBITDA, EV, EV/EBITDA, ROIC, current ratio; show ROE, ROA, P/B, NII, net interest margin, cost-to-income, GNPA/NNPA/CAR **only if the provider supplies them**. Display `Not applicable for banks` (not `—`).

## 5. Quality display
- `FreshnessBadge` on header and each section.
- Statement-derived metrics show period: `TTM · to Dec 2025` or `FY2025`.
- Any quality flag (Phase 10) surfaces as a `⚠` with tooltip; `STANDALONE_ONLY` appears in the snapshot section header.

## 6. Loading & failure behaviour
Header renders as soon as quote returns; sections load independently; any section may be `unavailable` without breaking others. Skeletons match dimensions.

## 7. SEO/meta
Title `Reliance Industries (RELIANCE.NS) — Hedger`; no investment claims in meta description.

## Do not
Present TTM as FY; blend consolidated and standalone; show EV for a bank; show a metric whose inputs are missing.

## Definition of Done
- [ ] Overview works for one instrument per region and one bank (e.g. HDFC Bank or JPMorgan).
- [ ] Every metric has a definition popover and unit test with the worked example.
- [ ] Missing inputs produce `—`/`NM`/`Not applicable` appropriately, verified by tests.
- [ ] Manual spot-check of 5 instruments against the company's reported filings (record in `docs/VALIDATION_LOG.md`).

---
**Next:** `phase-13-financial-statements.md`
