# Phase 03 — Frontend Audit & Project Foundation

**Prerequisite:** Phase 02 complete and merged.
**Progress:** Phase 3 of 20

> **Standing rules (apply to every phase)**
> 1. Complete **only this phase**; do not start the next. Do not mark it done until every item under *Definition of Done* passes, with evidence (test output, screenshots, or logs).
> 2. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI — missing data renders `—` (with reason), not-meaningful renders `NM`.
> 3. Every number carries **currency, unit/scale, as-of date and freshness**. Never mix currencies or substitute look-alike instruments.
> 4. The browser never calls the data provider; secrets stay server-side.
> 5. UI uses Phase 2 tokens and components only. Minimal, white, flat, Inter, tabular numbers.
> 6. If a requirement cannot be met with the available data, **stop and report** instead of approximating or fabricating.

**Goal:** Decide, with evidence, what to keep from the existing frontend; stand up a clean, strict, tested monorepo that every later phase builds in.

## 1. Audit the existing frontend (do before changing anything)
Produce `docs/FRONTEND_AUDIT.md` containing:
1. **Inventory:** framework, version, routing, state mgmt, styling, build tool, package manager, page list, component list, assets.
2. **Run it:** install, build, lint, typecheck; record errors/warnings counts.
3. **Per-component verdict** using this matrix:
| Verdict | Criteria |
|---|---|
| Keep | Typed, matches Phase 2 tokens, no data logic inside |
| Refactor | Good structure but ad-hoc styles or mixed concerns |
| Rewrite | Untyped, duplicated, hard-coded data, or fights the design system |
4. **Data-bug scan:** grep for hard-coded numbers, `toFixed` misuse, `|| 0` defaults, string concatenated currencies, direct third-party API calls, API keys in client code. List every hit.
5. **Design delta:** screenshots of current pages vs Phase 2 rules.
6. **Recommendation:** migrate in place vs fresh app + port. Default recommendation: **fresh Vite app, port only "Keep/Refactor" pieces.**

## 2. Repository layout (pnpm workspaces)
```
hedger/
  apps/
    web/            # React + TS + Vite + Tailwind
    api/            # Node + Express + TS
  packages/
    ui/             # design system (Phase 2)
    format/         # number/date formatting
    types/          # shared DTOs and zod schemas
    valuation/      # pure DCF engine (Phase 16)
  services/
    yf-gateway/     # Python (FastAPI) wrapper around yfinance — private network only (Phase 9)
  docs/
  .github/workflows/
```
Why shared `types` with **zod**: one schema validates API responses at runtime on the server *and* the client, catching provider/shape drift.

## 3. Tooling
- TypeScript `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
- ESLint (typescript-eslint, react-hooks, jsx-a11y, `no-restricted-syntax` banning `console.log` and raw hex colours), Prettier.
- Vitest (unit), Testing Library (components), Playwright (e2e), MSW (API mocking).
- Husky + lint-staged: lint, typecheck, test on changed files.
- Conventional Commits.
- `.env.example` committed; `.env*` in `.gitignore`; `gitleaks` pre-commit hook.
- CI (GitHub Actions): install → lint → typecheck → unit → build → e2e (smoke). Add a Python job (ruff + pytest) for `services/yf-gateway`.

## 4. Environment handling
- Server-only variables are validated at boot with zod (`FINNHUB_API_KEY`, `ALPHAVANTAGE_API_KEY`, `YF_GATEWAY_URL`, `YF_GATEWAY_SECRET`, `DATABASE_URL`, `SESSION_SECRET`, `REDIS_URL?`). App refuses to start if invalid.
- Client may only read `VITE_*` variables, none of which may be secrets. CI step fails if the built bundle contains the string of any server secret name or key pattern.

## 5. Regression tests for the prior audit's bugs (write now, fail-first)
- `formatCompact` never returns `NaN`/`undefined` for any input including `null`.
- A rendered snapshot test scans DOM text for `/\b(null|undefined|NaN|Infinity)\b/`.
- Currency mixing test: adding two `Money` of different currencies throws.

## 6. Deliverables
`FRONTEND_AUDIT.md`, working monorepo with `pnpm dev` (web + api), CI green on an empty-but-real app, `README.md` with setup in ≤ 6 commands.

## Do not
Build any real page yet. Do not copy styles from the old frontend.

## Definition of Done
- [ ] Audit document complete with a verdict for every existing component.
- [ ] `pnpm i && pnpm dev` starts both apps; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass.
- [ ] CI is green on a pull request.
- [ ] Bundle-secret scan and the three regression tests exist and run in CI.

---
**Next:** `phase-04-landing-page.md`
