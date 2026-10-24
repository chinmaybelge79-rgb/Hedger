# Phase 20 — Deployment, Compliance & Launch

**Prerequisite:** Phase 19 complete and merged.
**Progress:** Phase 20 of 20

> **Standing rules (apply to every phase)**
> 1. Complete **only this phase**; do not start the next. Do not mark it done until every item under *Definition of Done* passes, with evidence (test output, screenshots, or logs).
> 2. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI — missing data renders `—` (with reason), not-meaningful renders `NM`.
> 3. Every number carries **currency, unit/scale, as-of date and freshness**. Never mix currencies or substitute look-alike instruments.
> 4. The browser never calls the data provider; secrets stay server-side.
> 5. UI uses Phase 2 tokens and components only. Minimal, white, flat, Inter, tabular numbers.
> 6. If a requirement cannot be met with the available data, **stop and report** instead of approximating or fabricating.

**Goal:** A reproducible, observable, secure production deployment with the legal and data-licensing groundwork in place.

## 1. Pre-launch compliance (do not skip)
- **Data licensing (per provider):** Finnhub's free plan, Alpha Vantage's free tier and yfinance/Yahoo data are each offered under personal-use or research-oriented terms; confirm in writing (or by reading the current terms) what each permits for **public, commercial display and for caching/storing data**. Anything not permitted must be replaced with a licensed provider through the Phase 9 adapter **before** public launch; until then run as a private/personal deployment. Add required attribution in the footer and on data pages.
- **Disclaimers (pages `/terms`, `/privacy`, `/disclaimer`):** information and tools only, not investment advice; valuation outputs are estimates from user-editable assumptions; data may be delayed or inaccurate; past performance not indicative; no guarantee of completeness.
- **Regulatory check (India and other target markets):** have a qualified lawyer confirm that Hedger's content (valuation estimates, any "ratings", thesis library) doesn't require registration under rules such as SEBI's Research Analyst / Investment Adviser regulations. Keep language factual; avoid buy/sell/hold recommendations and "target price" framing unless advised otherwise.
- **Privacy:** privacy policy listing data collected (email, usage), retention, processors, deletion process; cookie notice only if non-essential cookies/analytics are used; prefer privacy-friendly analytics without cross-site tracking.

## 2. Environments
`local` → `staging` (production-like, real provider sandbox/limits, seeded test accounts) → `production`. Separate databases, secrets, provider keys, and domains. Staging is noindexed and password-gated.

## 3. Infrastructure
- **Containers:** multi-stage Dockerfiles (non-root user, read-only filesystem where possible, pinned base image digests). `apps/web` built to static assets served by a CDN; `apps/api` as a stateless container (≥ 2 instances); `services/yf-gateway` as a separate container reachable only on the private network (no public route, shared-secret auth).
- **Hosting (choose one and record in `DECISIONS.md`):** e.g. managed PaaS (Render/Railway/Fly.io) or a cloud provider region close to users (India: Mumbai region) with managed Postgres and managed Redis. Keep the design portable.
- **Database:** managed PostgreSQL, TLS required, automated daily backups + point-in-time recovery, tested restore (record RTO/RPO), connection pooling (PgBouncer or provider pooler), migrations run as a separate release step (`prisma migrate deploy`), backwards-compatible migrations (expand → migrate → contract).
- **Redis:** managed, TLS, eviction policy `allkeys-lru` for cache; session store either Postgres or persistent Redis.
- **Background jobs:** scheduler for nightly screener snapshot, statement refresh, quote warm-up, cache invalidation, provider probe; jobs idempotent, with logs and alerts on failure.
- **Edge:** TLS everywhere (HSTS preload when stable), CDN caching for static assets (immutable hashed files), `Cache-Control` for API (`private, no-store` for user data; short `s-maxage` + `stale-while-revalidate` for public market data), gzip/brotli, WAF/rate limiting, bot protection for auth endpoints.
- **DNS & email:** SPF, DKIM, DMARC for transactional email (verification, reset).

## 4. Configuration matrix (`docs/ENV.md`)
| Variable | Where | Secret | Notes |
|---|---|---|---|
| `NODE_ENV` | api/web build | no | `production` forbids the fixture provider |
| `DATABASE_URL` | api | yes | TLS required |
| `REDIS_URL` | api | yes | optional |
| `SESSION_SECRET` | api | yes | ≥ 32 bytes random; rotation plan |
| `FINNHUB_API_KEY` | api | yes | never in web |
| `ALPHAVANTAGE_API_KEY` | api | yes | background jobs only |
| `YF_GATEWAY_URL` | api | no | internal address |
| `YF_GATEWAY_SECRET` | api + gateway | yes | shared secret |
| `ALLOWED_ORIGINS` | api | no | CORS allow-list |
| `EMAIL_API_KEY`, `EMAIL_FROM` | api | yes/no | |
| `SENTRY_DSN` | both | no | |
| `VITE_API_BASE_URL` | web build | no | |
Secrets live in the host's secret manager; rotate on any suspected exposure; CI uses short-lived OIDC credentials where possible.

## 5. CI/CD
- Pipeline: lint → typecheck → unit/integration → build → e2e on preview → security scans → deploy staging → smoke tests → manual approval → deploy production (blue/green or rolling) → post-deploy smoke.
- Preview deploys per pull request.
- Versioned releases (tags), changelog, one-click rollback to previous image; database rollback via forward-fix + PITR.
- Feature flags for risky features; the fixture provider cannot be enabled in production (startup assertion + CI test).

## 6. Observability
- **Logging:** structured JSON with request id; no PII/secrets; log provider latency, cache hit ratio, error codes.
- **Metrics:** API latency/error rate, provider error/429 rate, cache hit rate, quote freshness lag, job success, DB connections, saturation. Dashboard + alerts (error rate > 2% for 5 min, p95 latency, provider failures, stale-quote ratio, job missed, disk/DB near capacity).
- **Tracing:** OpenTelemetry on the API→provider→DB path.
- **Frontend:** Sentry (sourcemaps uploaded privately), Web Vitals reporting.
- **Uptime:** external checks on `/healthz` (process), `/readyz` (DB, cache, provider reachability), and a synthetic journey (search → company page).
- **Data-quality alerts:** spike in `quality_flags`, `SCHEMA_MISMATCH` errors, or screener snapshot older than 36 h.

## 7. Operational runbooks (`docs/runbooks/`)
Provider outage · Provider quota exhausted · Bad data report (trace via raw payload id → normalisation → UI) · DB restore · Secret rotation · Failed migration · Rollback · Incident template and severity definitions.

## 8. Launch plan
1. Soft launch to a small invite list on production with a visible `Beta` label; feedback link (simple form).
2. Monitor for 7 days: errors, latency, provider quota usage, data-quality flags, user-reported inaccuracies.
3. Fix-forward weekly; publish a short public "Data & methodology" page (definitions from `METRICS.md`, DCF methodology, coverage list, known limitations).
4. Only then widen access and consider SEO indexing of company pages (check provider terms on public display first).

## 9. Final launch checklist
- [ ] `RELEASE_READINESS.md` approved (Phase 19).
- [ ] Provider licensing confirmed; attribution displayed.
- [ ] Legal pages live; regulatory advice obtained and recorded.
- [ ] Backups verified by an actual restore; rollback rehearsed.
- [ ] Secrets rotated from any dev values; none in repo history (`gitleaks --log-opts=--all`).
- [ ] Alerts firing to a real channel (test alert sent).
- [ ] Load test passed against staging at 2× expected launch traffic.
- [ ] Production smoke test: J1–J7 executed manually.
- [ ] Support email and bug-report path live; response owner assigned.

## Do not
Deploy with the fixture provider, a shared dev database, wildcard CORS, debug logging of payloads containing user data, or without tested backups.

## Definition of Done
- [ ] Production reachable over HTTPS with all checklist items complete.
- [ ] Post-deploy smoke tests and 24 h of clean monitoring recorded.
- [ ] Runbooks reviewed by the person who will be on call (you).

---
**Next:** Launch. Maintain `docs/runbooks/` and review accuracy monthly.
