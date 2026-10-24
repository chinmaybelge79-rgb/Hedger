# Phase 17 — Peer Comparison & Relative Valuation

**Prerequisite:** Phase 16 complete and merged.
**Progress:** Phase 17 of 20

> **Standing rules (apply to every phase)**
> 1. Complete **only this phase**; do not start the next. Do not mark it done until every item under *Definition of Done* passes, with evidence (test output, screenshots, or logs).
> 2. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI — missing data renders `—` (with reason), not-meaningful renders `NM`.
> 3. Every number carries **currency, unit/scale, as-of date and freshness**. Never mix currencies or substitute look-alike instruments.
> 4. The browser never calls the data provider; secrets stay server-side.
> 5. UI uses Phase 2 tokens and components only. Minimal, white, flat, Inter, tabular numbers.
> 6. If a requirement cannot be met with the available data, **stop and report** instead of approximating or fabricating.

**Goal:** Defensible peer sets, a like-for-like comparison table, and implied value from peer multiples.

## 1. Peer selection (server, deterministic, explainable)
Candidate pool = active equities with the same `industry` (fallback `sector`), same `company_type`.
Score each candidate:
```
score = 0.40 × industrySimilarity            # 1 same industry code, 0.5 same sector, else 0
      + 0.25 × sizeSimilarity                # 1 − min(1, |ln(mcap_candidate / mcap_target)| / ln(4))
      + 0.20 × regionSimilarity              # 1 same country, 0.6 same region, 0.3 other
      + 0.15 × profileSimilarity             # closeness of revenue growth & margin ranks (optional; skip if data missing)
```
Take the top 8 with `mcap` within 0.25×–4× the target when possible. Every peer row shows **why** it was chosen (`Same industry · similar size · India`). Exclude the target's other listings (same issuer).
**Overrides:** curated peer sets for conglomerates/special cases stored in `peer_overrides.json` (e.g. Reliance → segment-based sets: oil-to-chemicals/energy, retail, telecom/digital). For conglomerates show a notice: "Multi-segment company; consider peers per segment."

## 2. Comparison table (columns configurable; defaults below)
Revenue growth (1Y, 3Y CAGR) · EBITDA margin · Operating margin · Net margin · P/E · EV/EBITDA · P/B · ROE · ROIC · Debt/Equity · FCF yield · Market cap (USD-normalised with FX note).
- Bank peer sets use: P/E, P/B, ROE, ROA, NIM/GNPA only if available. Never mix a bank into a general peer set.
- Rows: target (pinned, bold) then peers; footer rows: **Median**, **Mean**, **25th–75th percentile**, and target's **percentile rank** per metric.
- Add/remove peers: searchable "Add company" (Phase 8) with type/currency validation; removing a peer recalculates summary stats immediately; "Reset to suggested".
- Ratios are dimensionless, so cross-currency comparison is valid **provided each ratio was computed in-currency** (Phase 10). Absolute amounts are shown in USD with FX date or in local currency with currency labels.

## 3. Statistics rules
- Use **median** as headline (robust). Exclude `NM`/`missing` values and show `n` used (e.g. `median of 6 of 8`).
- If `n < 3` for a metric → statistic shows `—` ("too few peers").
- Winsorise at 5th/95th percentile only for the *mean*; document.
- Percentile rank of target in peer set = `(count of peers with metric < target + 0.5 × count equal) / n`.

## 4. Implied valuation from peers
For multiple `M ∈ {P/E, EV/EBITDA, EV/Sales, P/B}`:
```
Implied EV      = peerMedian(EV/EBITDA) × target EBITDA(TTM)
Implied equity  = Implied EV − net debt − minorities − preferred
Implied price   = Implied equity / diluted shares
P/E method:       Implied price = peerMedian(P/E) × target EPS(TTM)
P/B method:       Implied price = peerMedian(P/B) × target BVPS
```
Shown as a **football-field chart**: horizontal bars of (25th–75th percentile implied price) per method, a marker for the median, a vertical line for current price, and the DCF Bear–Bull range (Phase 16) as an additional bar. Currency = target's quote currency (peer multiples are unitless).
**Worked example:** Peer median EV/EBITDA 9.0x; target EBITDA 5,650; net debt 6,500; minority 500; shares 100 → implied EV 50,850; equity 43,850; implied price 438.5 (vs 500 current).
Skip a method if the target's metric is `NM`.

## 5. Valuation tab integration
Add "Relative valuation" section in the Valuation tab linking to the Peers tab; summary bar on Valuation shows DCF range and peer-implied range together, no blended "fair value".

## 6. Endpoint
`GET /api/v1/instruments/:id/peers?set=suggested|custom&ids=...` → `{ target, peers:[{ ..., reason }], stats:{ metric:{ median, mean, p25, p75, n } }, implied:{ method:{ low, median, high } } }`.

## 7. Tests
Selection determinism; override applied for Reliance; bank vs general separation; median with NM exclusions; n<3 suppression; implied price worked example; football-field ranges in correct order.

## Do not
Compare banks with industrials; use mean as the only summary; include the target in its own peer statistics; hide why a peer was selected.

## Definition of Done
- [ ] Suggested peers for 5 seeded companies are sensible and explained.
- [ ] Add/remove updates stats and charts instantly and correctly.
- [ ] Football-field chart matches table-derived numbers.
- [ ] Worked-example test passes.

---
**Next:** `phase-18-accounts-saved-analysis.md`
