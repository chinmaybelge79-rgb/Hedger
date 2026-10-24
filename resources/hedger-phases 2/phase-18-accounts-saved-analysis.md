# Phase 18 — Accounts, Watchlists & Saved Analysis

**Prerequisite:** Phase 17 complete and merged.
**Progress:** Phase 18 of 20

> **Standing rules (apply to every phase)**
> 1. Complete **only this phase**; do not start the next. Do not mark it done until every item under *Definition of Done* passes, with evidence (test output, screenshots, or logs).
> 2. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI — missing data renders `—` (with reason), not-meaningful renders `NM`.
> 3. Every number carries **currency, unit/scale, as-of date and freshness**. Never mix currencies or substitute look-alike instruments.
> 4. The browser never calls the data provider; secrets stay server-side.
> 5. UI uses Phase 2 tokens and components only. Minimal, white, flat, Inter, tabular numbers.
> 6. If a requirement cannot be met with the available data, **stop and report** instead of approximating or fabricating.

**Goal:** Secure authentication, per-user watchlists, and reproducible saved valuations. Security first; features minimal.

## 1. Authentication (self-managed, session-based)
- Email + password. Hash with **argon2id** (memory ≥ 64 MiB, time cost ≥ 3, parallelism 1; tune to ~250 ms). Never log or return hashes.
- Sessions: server-side session store (Postgres or Redis), opaque 256-bit random ID in cookie: `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age` (idle 14 d sliding, absolute 30 d). Rotate session ID on login and privilege change.
- **CSRF:** SameSite=Lax plus double-submit token (or `Origin`/`Sec-Fetch-Site` check) on all state-changing requests.
- Email verification (signed, single-use, 24 h token) required before saving data or syncing watchlists.
- Password reset: single-use hashed token, 30 min expiry, generic responses (no account enumeration), invalidate all sessions on reset.
- Rate limits: login 5 / 15 min per account + IP; signup, reset and verification email limits; progressive delays; optional CAPTCHA only after abuse.
- Password policy: ≥ 10 chars, check against a breached-password list (k-anonymity API or offline list), no composition rules; show strength guidance.
- Optional "Sign in with Google" (OIDC, PKCE) — add only if requested; same session mechanism.
- Account deletion and data export (JSON) in `/profile` — supports Indian DPDP Act and GDPR-style expectations; deletion is hard-delete within 30 days with confirmation.
- Security headers: CSP (no inline scripts; allow only self + required hosts), HSTS, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `frame-ancestors 'none'`, `Permissions-Policy` minimal.
- No tokens in `localStorage`. No secrets in URLs.

## 2. Data model (Prisma)
```
User { id, email (citext unique), emailVerifiedAt?, passwordHash, createdAt, lastLoginAt, displayName?, preferences jsonb }
Session { id, userId, createdAt, expiresAt, lastSeenAt, ipHash, userAgentHash }
Watchlist { id, userId, name, createdAt }                      -- default "My watchlist"; v1 limit 10 lists
WatchlistItem { watchlistId, instrumentId, addedAt, note? }    -- unique(watchlistId, instrumentId), ≤ 200 items
SavedAnalysis { id, userId, type:'dcf'|'screen'|'peers'|'note', instrumentId?, title, createdAt, updatedAt,
                engineVersion, inputs jsonb, outputs jsonb, priceAtSave, currency, notes text?, deletedAt? }
AuditLog { id, userId?, action, ip hash, at, meta }
```
Row-level rule: every query is scoped by `userId` in the data-access layer (single `ownedBy(user)` helper; tests prove cross-user access returns 404).

## 3. Saved analysis behaviour
- **Reproducibility:** store `inputs` (all assumptions incl. defaults and their sources/dates), `outputs`, `engineVersion` (semver from `packages/valuation`), and `priceAtSave` with timestamp.
- Reopen → shows the *saved* result exactly and a banner "Saved 12 Mar 2026 at ₹X · current price ₹Y". Button "Recalculate with latest data" creates a new run (does not overwrite the old).
- If engine major version changed, label "Saved with engine v1.x; recalculation may differ."
- Save screens (Phase 15 filters) and peer sets as lightweight JSON.
- `/saved-analysis`: list with search, type filter, delete (soft delete 30 d), rename, duplicate. Empty state is calm and explanatory.
- Watchlist page: table with price, change, market cap, P/E, plus last saved valuation upside (if any); add/remove from company header star; drag reorder optional (skip in v1).

## 4. API
`POST /auth/signup|login|logout|verify|forgot|reset` · `GET /me` · `PATCH /me` · `DELETE /me` · `GET/POST/PATCH/DELETE /watchlists…` · `GET/POST/PATCH/DELETE /analyses…`. All validated with zod; JSON size limit 256 kB on analyses; pagination on lists.

## 5. UI
Minimal forms: single column, 360 px max width, clear inline errors, `autocomplete` attributes, show/hide password, loading states; no marketing clutter. `/profile`: email, display name, number-format preference (Indian/International), delete account, export data, sign out everywhere.
`/pricing`: static informational page (v1 has **no payments**); if tiers are planned, show "Free during early access" or hide the route.

## 6. Tests
- Auth flow e2e (signup → verify → login → save → logout).
- Security tests: session fixation, CSRF without token fails, password reset token reuse fails, enumeration timing within tolerance, rate limit triggers, IDOR (user A cannot read user B's analysis).
- Argon2 parameters assertion; cookie flags assertion.
- Reproducibility: save → reload → identical outputs; engine-parity test with Phase 16.

## Do not
Roll your own crypto; store plaintext secrets; put sessions in `localStorage`; build social/community features; add payment flows.

## Definition of Done
- [ ] All security tests above pass; OWASP ASVS L2 auth checklist reviewed and recorded.
- [ ] Saving and reopening a DCF reproduces exact outputs.
- [ ] Watchlist works from header star, company page and list page.
- [ ] Account deletion and export verified.

---
**Next:** `phase-19-testing-validation.md`
