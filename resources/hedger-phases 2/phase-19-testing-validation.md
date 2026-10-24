# Phase 19 — Testing, Validation & Hardening

**Prerequisite:** Phase 18 complete and merged.
**Progress:** Phase 19 of 20

> **Standing rules (apply to every phase)**
> 1. Complete **only this phase**; do not start the next. Do not mark it done until every item under *Definition of Done* passes, with evidence (test output, screenshots, or logs).
> 2. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI — missing data renders `—` (with reason), not-meaningful renders `NM`.
> 3. Every number carries **currency, unit/scale, as-of date and freshness**. Never mix currencies or substitute look-alike instruments.
> 4. The browser never calls the data provider; secrets stay server-side.
> 5. UI uses Phase 2 tokens and components only. Minimal, white, flat, Inter, tabular numbers.
> 6. If a requirement cannot be met with the available data, **stop and report** instead of approximating or fabricating.

**Goal:** Prove accuracy, security, accessibility and performance with evidence. This phase gates deployment.

## 1. Test strategy (pyramid)
| Layer | Tooling | Targets |
|---|---|---|
| Unit | Vitest | `packages/format`, `valuation`, normalization, ranking — coverage ≥ 90% (valuation ≥ 95%) |
| Property | fast-check | Money math, DCF monotonicity, reverse-DCF round trip |
| Contract | zod + recorded provider fixtures | Provider/response schema drift |
| Integration | Vitest + Testcontainers (Postgres, Redis) | API routes, DB constraints, caching |
| Component | Testing Library | `DataState`, `Num`, tables, forms |
| E2E | Playwright (Chromium, WebKit, Firefox) | Journeys J1–J7 from Phase 1 |
| Visual regression | Playwright screenshots | Key pages at 1440 / 768 / 390 widths |
| Accessibility | axe + manual keyboard/screen-reader pass | WCAG 2.2 AA |
| Performance | Lighthouse CI, k6 | Budgets below |
| Security | Semgrep, `npm audit`/OSV, gitleaks, ZAP baseline | No high findings |

## 2. Financial accuracy audit (most important)
Create `docs/ACCURACY_AUDIT.md` with a **golden set of 20 instruments** (≥ 6 India incl. 2 banks, 6 US incl. 1 bank, 4 Europe, 4 APAC incl. one LSE pence-quoted and one with an ADR).
For each, compare Hedger vs primary sources (annual reports/exchange filings and the exchange's quote page):
| Item | Tolerance |
|---|---|
| Revenue, EBIT, net income, total assets, equity, CFO (last 3 FY) | ≤ 0.5% (or explained: restatement, standalone vs consolidated, units) |
| Shares outstanding | ≤ 1% |
| Market cap, EV | ≤ 2% (timing differences explained) |
| P/E, P/B, EV/EBITDA | ≤ 2% vs recomputation from source figures |
| Price & 52W range | exact to the provider's quote at the same timestamp |
| DCF output | Matches independent spreadsheet within 0.1% for same inputs |
Any miss → root-cause, fix, add a regression test. Log in a table: Company · Item · Hedger · Source · Δ% · Status · Notes.

## 3. Data-integrity gates (automated, run in CI and nightly)
- **Leakage scanner:** crawl every route (with fixtures + real-data snapshots) and assert no `null|undefined|NaN|Infinity|[object Object]|Invalid Date` in visible text, `aria-label`, or `title` attributes.
- **Currency scanner:** every displayed monetary value has a currency symbol/code in context; cross-currency arithmetic tests.
- **Freshness scanner:** every data section has a `FreshnessBadge`.
- **Invariant dashboard:** `/dev/quality` shows counts of quality flags per day; alert if > baseline.
- **Router test:** no bank/NBFC/insurer ever produces an FCFF DCF.
- **Consistency test:** same metric on Overview, Financials, Valuation, Peers and Screener returns the same value for the same instrument/date.

## 4. Journey e2e (from Phase 1)
J1 search → company · J2 financials toggle · J3 DCF edit + sensitivity · J4 peers add/remove · J5 screener filters · J6 sign-in & save/reopen · J7 markets. Each runs on desktop and a 390 px mobile profile, with provider mocked (recorded) and a smoke pass against the live provider (non-blocking).

## 5. Performance budgets
| Metric | Budget |
|---|---|
| Landing LCP / CLS / INP | < 1.8 s / < 0.02 / < 200 ms |
| Company page LCP (cached API) | < 2.5 s on throttled 4G |
| JS per route (gzip) | landing ≤ 120 kB; company ≤ 250 kB; DCF ≤ 300 kB |
| API p95 | cached < 150 ms, uncached < 800 ms |
| Screener p95 | < 300 ms |
| Load test (k6) | 200 concurrent users, 5 min, error rate < 0.5% |
Add bundle analysis; lazy-load charts and valuation UI.

## 6. Security review
- OWASP ASVS L2 checklist (auth, session, access control, input validation, API, config) recorded with pass/fail/NA + evidence.
- Verify: no secrets in bundle/logs/errors; CORS allow-list; CSP enforced; rate limits; dependency pinning; SQL via ORM/parameterised only; request size limits; SSRF-safe outbound (provider hosts allow-list); error responses don't leak stack traces; cookie flags.
- Threat model one-pager (STRIDE) for: auth, provider proxy, saved analyses.
- Dependency update policy and Renovate/Dependabot enabled.

## 7. Accessibility
Keyboard-only run of J1–J7; screen reader (NVDA/VoiceOver) on search, tables, chart data-table fallback, DCF inputs; colour-contrast audit; reduced-motion; 200% zoom and 320 px reflow.

## 8. Usability pass
5 external testers (or friends) complete J1–J7 unaided; record time-to-first-value and confusion points; fix top 5 issues. Verify the UI remains minimal: remove any element no tester used or understood.

## 9. Chaos & failure testing
Provider down, slow, rate limited, schema drift → pages show `stale`/`unavailable` correctly; DB failover; Redis unavailable (fallback works); clock skew; large symbol list.

## 10. Exit report
`docs/RELEASE_READINESS.md`: test results, accuracy audit summary, open defects by severity (no Sev-1/2 open), performance numbers, security checklist, known limitations (coverage gaps).

## Definition of Done
- [ ] Accuracy audit complete, all items within tolerance or explained.
- [ ] All CI gates green; zero axe violations on key pages; budgets met.
- [ ] No open Sev-1/Sev-2 defects; Sev-3 triaged.
- [ ] `RELEASE_READINESS.md` approved by the product owner.

---
**Next:** `phase-20-deployment-launch.md`
