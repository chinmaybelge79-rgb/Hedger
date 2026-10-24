# Phase 04 — Landing Page

**Prerequisite:** Phase 03 complete and merged.
**Progress:** Phase 4 of 20

> **Standing rules (apply to every phase)**
> 1. Complete **only this phase**; do not start the next. Do not mark it done until every item under *Definition of Done* passes, with evidence (test output, screenshots, or logs).
> 2. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI — missing data renders `—` (with reason), not-meaningful renders `NM`.
> 3. Every number carries **currency, unit/scale, as-of date and freshness**. Never mix currencies or substitute look-alike instruments.
> 4. The browser never calls the data provider; secrets stay server-side.
> 5. UI uses Phase 2 tokens and components only. Minimal, white, flat, Inter, tabular numbers.
> 6. If a requirement cannot be met with the available data, **stop and report** instead of approximating or fabricating.

**Goal:** A spacious, elegant, honest marketing page that explains Hedger in 10 seconds and gets the visitor into search.

## 1. Rules
- Marketing density: generous whitespace (section padding 96–128 px desktop, 64 px mobile).
- **No fabricated social proof.** No fake user counts, logos, testimonials, awards, or "live" tickers unless real data is wired (Phase 9+). Any illustrative numbers must be visibly labeled `SAMPLE DATA`.
- Pricing stays off the hero. A footer/nav link to `/pricing` is enough.
- Static content only; no API calls on this page except optional search suggestions (Phase 8).

## 2. Page structure (in order)
1. **Header:** `HEDGER` wordmark · Models · Markets · Investment Thesis · Community & News · About · (right) Search · Sign In · Get Started.
2. **Hero:** one sentence (display type) + one supporting line + large search input + two quiet example chips (`Reliance`, `Apple`).
   - Suggested copy: *"Research any listed company. Value it with clarity."* / *"Indian and global equities, financial statements and transparent valuation models."* Adjust as desired; keep ≤ 12 words in the headline.
3. **Four pillars** (Discover · Understand · Compare · Value): icon (1.5 px stroke), title, 1–2 line description. Four equal columns → 2×2 → stacked.
4. **Product preview:** a static, built-from-real-components view of a company page and a DCF panel using fixture data, framed with a thin border, labeled `SAMPLE DATA · Not a recommendation`.
5. **Trust section — "How Hedger treats data":** four short points straight from `DATA_TRUST.md` (freshness labels, no silent substitutions, calculated vs reported, transparent assumptions).
6. **Coverage:** India · US · Europe · Asia-Pacific as plain text columns. State "Coverage varies by company and data availability."
7. **Closing CTA:** Search input repeated or `Get started`.
8. **Footer:** product links, legal links (Terms, Privacy, Disclaimer), data attribution line, "Hedger provides information and analytical tools, not investment advice."

## 3. Interactions
- Hero search is a real input that opens the Phase 8 search overlay later; for now it routes to `/markets` on Enter with a TODO flag-off. Use a feature flag `search.enabled`.
- Header is sticky with a 1 px bottom border appearing after 8 px scroll.
- Entrance animations: single 200 ms fade/translate-up, once; none under reduced motion.

## 4. Responsiveness
Design at 1440, 1024, 768, 390 widths. Mobile nav = a simple full-screen menu (no nested items).

## 5. SEO & meta
Title, description, canonical, Open Graph image (static, generated from tokens), `robots.txt`, `sitemap.xml` (landing + public routes), JSON-LD `Organization`. No indexing of `/saved-analysis`, `/profile`.

## 6. Performance budget
JS on landing ≤ 120 kB gzipped (route-level code splitting), no layout shift (CLS < 0.02), LCP < 1.8 s, Lighthouse ≥ 95 for Performance/Accessibility/Best Practices/SEO.

## 7. Do not
Add carousels, auto-playing video, stock photography, parallax, popups, cookie banners beyond what law requires (add in Phase 20 if needed).

## Definition of Done
- [ ] Matches Phase 2 tokens exactly (no ad-hoc values).
- [ ] Visually reviewed at four widths; screenshots committed to `docs/screens/phase-04/`.
- [ ] Lighthouse targets met; axe zero violations.
- [ ] Every number/figure on the page is labeled `SAMPLE DATA` or traceable to a doc.

---
**Next:** `phase-05-navigation-routing.md`
