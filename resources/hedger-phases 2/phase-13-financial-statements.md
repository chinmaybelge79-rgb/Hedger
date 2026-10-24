# Phase 13 — Financial Statements

**Prerequisite:** Phase 12 complete and merged.
**Progress:** Phase 13 of 20

> **Standing rules (apply to every phase)**
> 1. Complete **only this phase**; do not start the next. Do not mark it done until every item under *Definition of Done* passes, with evidence (test output, screenshots, or logs).
> 2. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI — missing data renders `—` (with reason), not-meaningful renders `NM`.
> 3. Every number carries **currency, unit/scale, as-of date and freshness**. Never mix currencies or substitute look-alike instruments.
> 4. The browser never calls the data provider; secrets stay server-side.
> 5. UI uses Phase 2 tokens and components only. Minimal, white, flat, Inter, tabular numbers.
> 6. If a requirement cannot be met with the available data, **stop and report** instead of approximating or fabricating.

**Goal:** Accurate, auditable income statement, balance sheet and cash flow views with annual/quarterly toggle and 5–10 years where data exists.

## 1. Endpoint
```
GET /api/v1/instruments/:id/financials?statement=income|balance|cashflow&period=annual|quarterly&limit=10&consolidation=consolidated
→ { data: {
     currency, scale: 1e7|1e6|..., fiscalYearEndMonth, consolidation,
     periods: [{ label:'FY2025', periodEnd:'2025-03-31', reportedAt?, restated:boolean, flags:[] }],
     rows: [{ key, label, level, kind:'reported'|'calculated', values: (string|null)[] , reasonMissing?: (string|null)[] }]
   }, meta }
```

## 2. Row templates
### General companies
**Income:** Revenue · COGS · **Gross profit** (calc if absent) · SG&A · R&D · **EBITDA** (calc) · D&A · **EBIT/Operating income** · Interest expense · Other income · **Pre-tax income** · Tax · **Net income** · Net income to common · EPS (basic) · EPS (diluted) · Diluted shares.
**Balance:** Cash & ST investments · Receivables · Inventory · **Current assets** · Net PP&E · Goodwill & intangibles · **Total assets** · Payables · ST debt · **Current liabilities** · LT debt · Lease liabilities · **Total liabilities** · Minority interest · **Total equity**.
**Cash flow:** Net income · D&A · Working-capital change · **Operating cash flow** · **Capex** · Acquisitions · **Free cash flow** (calc: CFO + Capex) · Dividends · Buybacks · Debt issued/repaid · **Net change in cash**.
### Banks / NBFCs / insurers (different template — never force general rows)
**Income:** Interest income · Interest expense · **Net interest income** · Non-interest income · Operating expenses · Pre-provision operating profit · Provisions · Pre-tax · Net income.
**Balance:** Cash & central bank · Loans (net) · Investments · Total assets · Deposits · Borrowings · Equity.
**Cash flow:** shown but with FCF hidden (not meaningful).
Key rows are bold; subtotals have a top hairline.

## 3. Table UX
- Columns = periods, latest on the **left** (matches Indian/Screener-style convention) — configurable (`order=asc|desc`) but consistent app-wide.
- First column sticky; horizontal scroll with fade edges; row hover highlight; keyboard focusable cells.
- Units selector: **As reported scale** (default) · Millions · Crores (shown for INR) · Billions. Conversions are presentational (`value / scale`) and always labeled in the table header: `₹ crore, consolidated, FY ends 31 Mar`.
- Toggle: Annual / Quarterly (URL-bound). Quarterly view shows 8–12 quarters; TTM column appended for flow items.
- Derived rows have a subtle `ƒ` marker + tooltip with the formula; reported rows have none.
- Restated periods: header marker `R` + tooltip ("Restated in FY2026 filing"). Missing periods render an explicit empty column with `—` and a reason, not a gap.
- YoY growth toggle: show `%` beneath each value for flow items (`NM` when prior ≤ 0).
- "Data as of" line: `Source: <provider> · retrieved <date> · latest period <label>`.
- Export CSV (client-side from the already-validated data), includes currency, scale, period end dates.

## 4. Derived-row formulas
- Gross profit = Revenue − COGS (only if not reported; mark calculated).
- EBITDA = EBIT + D&A (D&A from cash flow if absent in income).
- FCF = CFO + Capex (capex negative).
- Working-capital change as reported; do not recompute.
- Growth_t = `X_t / X_{t−1} − 1`.
- Margin rows optional section "Margins & ratios" below the statement: gross, EBITDA, operating, net, FCF margin, effective tax rate.

## 5. Integrity UI
Show a small "Checks" disclosure: ✅ Balance sheet balances · ✅ FCF reconciles · ⚠ Quarters don't sum to FY (flag details). Pulled from Phase 10 `quality_flags`.

## 6. Edge cases (tests)
- Fewer periods than requested → show what exists with message "5 years available".
- Negative equity, zero revenue, loss-making companies (growth `NM`).
- Fiscal year change (transition period) — show longer/shorter period note.
- Different currency for statements vs price (ADR): header states **reporting currency**; per-share rows not auto-converted.
- Indian company with both consolidated and standalone: toggle appears only if both exist; default consolidated; clear banner when switched.
- Provider returns different line items per period — union rows, `—` where absent.

## 7. Accessibility
Real `<table>` with `<caption>`, `<th scope>`; numbers right-aligned tabular; sticky column does not break screen-reader order.

## Do not
Show values in mixed scales; sum across currencies; hide restatements; present Q4 derived numbers as reported.

## Definition of Done
- [ ] Three statements × annual/quarterly render for one instrument per region, plus a bank template.
- [ ] Units/scale conversions unit-tested (e.g. `1,25,000 crore = ₹1.25 L Cr = 1,250,000 million INR`).
- [ ] Manual reconciliation of 3 companies vs official filings logged in `VALIDATION_LOG.md` (differences > 1% explained).
- [ ] CSV export verified against on-screen values.

---
**Next:** `phase-14-valuation-metrics.md`
