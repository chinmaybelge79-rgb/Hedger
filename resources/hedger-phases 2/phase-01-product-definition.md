# Phase 01 — Product Definition

**Prerequisite:** none — this is the first phase.
**Progress:** Phase 1 of 20

> **Standing rules (apply to every phase)**
> 1. Complete **only this phase**; do not start the next. Do not mark it done until every item under *Definition of Done* passes, with evidence (test output, screenshots, or logs).
> 2. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI — missing data renders `—` (with reason), not-meaningful renders `NM`.
> 3. Every number carries **currency, unit/scale, as-of date and freshness**. Never mix currencies or substitute look-alike instruments.
> 4. The browser never calls the data provider; secrets stay server-side.
> 5. UI uses Phase 2 tokens and components only. Minimal, white, flat, Inter, tabular numbers.
> 6. If a requirement cannot be met with the available data, **stop and report** instead of approximating or fabricating.

**Goal:** Freeze scope, users, journeys, coverage and data-trust rules in written form so every later phase is verifiable against them.

## 1. Product statement
Hedger is a minimalist equity research and valuation platform for Indian and global listed companies. Four jobs, in order of priority: **Discover → Understand → Compare → Value.** Anything that does not serve one of these is out of v1.

## 2. Primary users
| User | Need | Success looks like |
|---|---|---|
| Self-directed retail investor (India-first) | Understand a company and sanity-check its price | Finds a company, reads financials, sees a transparent valuation in < 3 minutes |
| Finance student / analyst | Learn and audit valuation mechanics | Can see every assumption and change it |
| Researcher comparing peers | Screen and compare | Gets a defensible peer table in < 1 minute |

## 3. Core user journeys (acceptance scenarios)
1. **J1 Discover:** Type "reliance" → select `RELIANCE.NS` (NSE, INR) → company page loads.
2. **J2 Understand:** Open Financials → toggle Annual/Quarterly → see 5+ years where data exists, with fiscal year-end and currency shown.
3. **J3 Value:** Open Valuation → see Base/Bull/Bear DCF, edit WACC and terminal growth, see price vs intrinsic value and a sensitivity grid.
4. **J4 Compare:** Open Peers → add/remove a peer → see median multiples and implied value.
5. **J5 Screen:** Screener → India + ROE > 15% + P/E < 25 → sortable results → click through to company.
6. **J6 Save:** Sign in → save a valuation with its assumptions → reopen it unchanged later.
7. **J7 Markets:** Open Markets → see index strip, performance chart, breadth, movers, with freshness labels.

## 4. v1 scope vs later
**In v1:** search, company overview, price charts, financial statements, valuation ratios, screener, DCF (+ reverse DCF, scenarios, sensitivity), peers, markets dashboard, watchlists, saved analyses, accounts, news (only if provider supports it).
**Later (do not build):** portfolio analytics, options, custom multi-panel dashboards, real-time professional feeds, macro dashboards beyond a few series, community features beyond a placeholder route, payments.

## 5. Coverage universe (initial, to be verified in Phase 9)
- **India:** Reliance, ONGC, HDFC Bank, ICICI Bank, SBI, TCS, Infosys, Wipro, HUL, ITC, Tata Motors, M&M, L&T, Sun Pharma, Dr. Reddy's, Bharti Airtel.
- **US:** Apple, Microsoft, Nvidia, Amazon, Alphabet, Meta, Berkshire Hathaway, JPMorgan, Walmart, Exxon Mobil.
- **Europe:** ASML, SAP, Novo Nordisk, LVMH, Shell, HSBC, Siemens.
- **Asia-Pacific:** Toyota, Sony, Samsung Electronics, TSMC, Tencent, Alibaba, BHP.
Coverage is a **target**, not a promise. A company is "covered" only when it passes the Phase 9 verification matrix.

## 6. Data-trust principles (non-negotiable, referenced by all phases)
1. Every number shows **currency, unit/scale, as-of date, and freshness class** (real-time / delayed / end-of-day / historical / calculated).
2. Missing ≠ zero. Missing renders `—` with a reason on hover/tap. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI.
3. Never substitute a similarly named instrument or silently convert currency.
4. Not meaningful ≠ missing: negative-earnings P/E renders `NM` (not meaningful).
5. Reported figures and calculated figures are visually distinguishable.
6. Valuation output is labeled an **estimate dependent on assumptions**, never advice.
7. A valuation model must match the company type: **banks/NBFCs/insurers do not use FCFF DCF** (see Phase 16).

## 7. Known failure modes to design against (from the prior Hedger audit)
- Broken market-cap figures → Phase 10 invariant: `marketCap = price × sharesOutstanding` validated, flagged if off by > 2%.
- Null values leaking into UI → Phase 6 `DataState` wrapper + Phase 19 leakage scanner.
- Currency inconsistencies → Phase 10 `Money` type; no raw numbers cross layers.
- FCFF DCF applied to a bank → Phase 16 company-type router.
- Weak India positioning → Indian conventions (lakh/crore, INR, FY Apr–Mar, NSE/BSE, consolidated vs standalone) are first-class, not afterthoughts.

## 8. Non-functional requirements
| Area | Target |
|---|---|
| Performance | Company page LCP < 2.5 s on 4G; API p95 < 500 ms (cached) |
| Accessibility | WCAG 2.2 AA |
| Browser | Latest 2 versions of Chrome, Safari, Firefox, Edge; iOS Safari |
| Responsive | Desktop-first; usable at 360 px width |
| Security | OWASP ASVS L2 as a checklist; no secrets in the client bundle |
| Language | English (en-IN default number formatting for India, en-US otherwise) |

## 9. Deliverables (create in repo under `/docs`)
- `PRODUCT.md` — sections 1–5 above, cleaned up.
- `JOURNEYS.md` — J1–J7 with step-by-step acceptance criteria.
- `DATA_TRUST.md` — section 6 verbatim plus examples of correct and incorrect rendering.
- `DECISIONS.md` — decision log (ADR style: context, decision, consequences). Seed with: stack choice, provider choice (pending), light-theme-only, no payments in v1.
- `OPEN_QUESTIONS.md` — provider/product name, licensing, hosting budget, auth method.

## 10. Do not
- Write application code in this phase.
- Add features not listed in section 4.

## Definition of Done
- [ ] All five docs exist and are internally consistent.
- [ ] Each journey J1–J7 has measurable acceptance criteria.
- [ ] Open questions are explicitly listed, each with an owner and the phase that needs the answer.
- [ ] Scope reviewed and signed off by the product owner (you).

---
**Next:** `phase-02-design-system.md`
