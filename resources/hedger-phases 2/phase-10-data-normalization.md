# Phase 10 — Data Normalization & Integrity Layer

**Prerequisite:** Phase 09 complete and merged.
**Progress:** Phase 10 of 20

> **Standing rules (apply to every phase)**
> 1. Complete **only this phase**; do not start the next. Do not mark it done until every item under *Definition of Done* passes, with evidence (test output, screenshots, or logs).
> 2. `null`, `undefined`, `NaN`, `Infinity` must never reach the UI — missing data renders `—` (with reason), not-meaningful renders `NM`.
> 3. Every number carries **currency, unit/scale, as-of date and freshness**. Never mix currencies or substitute look-alike instruments.
> 4. The browser never calls the data provider; secrets stay server-side.
> 5. UI uses Phase 2 tokens and components only. Minimal, white, flat, Inter, tabular numbers.
> 6. If a requirement cannot be met with the available data, **stop and report** instead of approximating or fabricating.

**Goal:** Turn raw provider payloads into one canonical, validated, currency-safe model. This phase is the main defense against wrong numbers.

## 1. Money & numeric types
- No JavaScript `number` for money, shares, or statement values after normalization. Use `decimal.js` (or `big.js`); serialise as **strings** over the API.
```ts
type Money = { value: string; currency: 'INR'|'USD'|...; scale: 1 | 1e3 | 1e6 | 1e7 | 1e9 };  // scale = how the displayed unit relates to base currency units
```
- Store everything in **base currency units** internally (not crores, not millions); scale is purely presentational and applied in Phase 2's formatters.
- Arithmetic helpers refuse to combine different currencies (throw `CurrencyMismatchError`).

## 2. Currency traps (must be handled and tested)
| Trap | Rule |
|---|---|
| LSE quotes in **pence** (`GBp`/`GBX`) while financials are in **GBP** | Convert quote to GBP by ÷100 before any ratio; keep `quoteCurrency` and `reportingCurrency` as separate fields |
| Similar minor-unit currencies (e.g. ILS agorot, ZAc) | Same pattern via a `MINOR_UNITS` table |
| ADRs/dual listings | Price currency ≠ reporting currency; ADR ratio (`ordinaries per ADR`) stored; per-share metrics adjusted |
| Zero-decimal currencies (JPY, KRW) | Display 0 dp |
| Quote currency ≠ reporting currency (e.g. TSMC in TWD vs ADR in USD) | Market cap/EV computed in **quote currency**; ratios use **same-currency** numerator and denominator, with explicit FX conversion tagged `fxRate`, `fxAsOf` |
FX conversion is explicit, logged, and uses a rate with timestamp. A ratio never mixes unconverted currencies.

## 3. Canonical entities
`Quote`, `PriceBar`, `CompanyProfile`, `StatementPeriod`, `StatementLine`, `KeyStats`, `CorporateAction`, `NewsItem`. Each carries: `instrumentId`, `source`, `asOf`, `retrievedAt`, `freshness`, `quality: { flags: QualityFlag[] }`.

### Fiscal-period model
```
StatementPeriod { fiscalYear:int, fiscalPeriod:'FY'|'Q1'|'Q2'|'Q3'|'Q4', periodEnd:date, periodStart:date?, fiscalYearEndMonth:int, reportedAt:date?, restated:boolean, consolidation:'consolidated'|'standalone'|'unknown', currency, unitsNote }
```
- **India:** fiscal year runs 1 Apr–31 Mar; label by the year it **ends** (FY2025 = year ended 31 Mar 2025). Provider "2025" may mean either — derive from `periodEnd`, never from a provider label.
- **Consolidated vs standalone:** prefer consolidated; if only standalone is available, flag `STANDALONE_ONLY`. Never mix within one time series.
- Quarterly Q4 can be derived (`FY − (Q1+Q2+Q3)`) for flow items only; flag as `derived`.
- **TTM** (flow items) = sum of last four reported quarters; for balance items use latest quarter. If fewer than four quarters, TTM = `—` (not annualised).

## 4. Line-item mapping (`mappings/<provider>.ts`)
Map provider fields → canonical keys with explicit sign convention:
`revenue, cogs, grossProfit, sga, rnd, ebitda, depreciationAmortization, ebit, interestExpense, interestIncome, pretaxIncome, incomeTax, netIncome, netIncomeToCommon, epsBasic, epsDiluted, sharesBasic, sharesDiluted, cash, shortTermInvestments, receivables, inventory, currentAssets, ppeNet, goodwill, intangibles, totalAssets, payables, shortTermDebt, currentLiabilities, longTermDebt, leaseLiabilities, totalLiabilities, minorityInterest, preferredEquity, totalEquity, commonEquity, operatingCashFlow, capex, dividendsPaid, buybacks, freeCashFlow`.
Conventions: expenses positive in the income statement; `capex` stored **negative** (cash outflow) in cash flow; `freeCashFlow = operatingCashFlow + capex`. A mapping table test fails if a provider field is unmapped *and* not explicitly ignored.

## 5. Company-type classification (feeds Phase 16)
`companyType: 'general' | 'bank' | 'nbfc' | 'insurance' | 'reit_trust' | 'utility' | 'unknown'` from industry codes with an override table (e.g. HDFC Bank, ICICI Bank, SBI → `bank`; JPMorgan → `bank`; HSBC → `bank`; Bajaj Finance → `nbfc`). Banks/NBFCs/insurers get a different statement template and metric set.

## 6. Invariant checks (run on every normalised object; failures → `QualityFlag`, never silent fixes)
| Check | Tolerance | Flag |
|---|---|---|
| Assets = Liabilities + Equity (+ minority if separate) | 0.5% of assets | `BALANCE_SHEET_IMBALANCE` |
| Gross profit = Revenue − COGS | 0.5% | `GROSS_PROFIT_MISMATCH` |
| FCF = CFO + Capex | exact (rounding) | `FCF_MISMATCH` |
| Market cap ≈ price × shares outstanding | 2% | `MARKET_CAP_MISMATCH` |
| EPS ≈ net income to common / diluted shares | 3% | `EPS_MISMATCH` |
| Sum of quarters ≈ annual (flow items) | 2% | `QUARTERS_DONT_SUM` |
| Price within [low, high] of its own bar; high ≥ low; volume ≥ 0 | exact | `BAD_BAR` |
| 1-day move > 40% with no corporate action | — | `SUSPECT_PRICE_JUMP` |
| Value ≤ 0 where must be > 0 (shares, price) | — | `NONPOSITIVE_INVALID` |
Flags travel in `meta.warnings` and render as subtle `⚠` markers (Phase 6).

## 7. Corporate actions & adjusted prices
Store splits (ratio) and dividends separately. `adjClose` from provider is accepted only if it reconciles: recompute adjustment factor from splits+dividends and compare within 0.5% on a sample; else flag `ADJUSTMENT_UNVERIFIED`. Charts use **split-adjusted** price for display and **total-return adjusted** only where labeled.
**Worked example (test):** 2-for-1 split on D: bars before D multiply price by 0.5 and volume by 2; shares outstanding pre-split × 2 for per-share comparability.

## 8. Derived values calculated once, centrally (`packages/valuation/metrics`)
`marketCap`, `enterpriseValue`, `ebitda` (if absent: `ebit + D&A`), `netDebt`, margins, growth rates, `fcfYield`. Each returns `{ value | null, reason? }` where `reason ∈ {MISSING_INPUT, NEGATIVE_DENOMINATOR, NOT_APPLICABLE_TO_TYPE, INSUFFICIENT_HISTORY}`.

## 9. Persistence (Postgres/Prisma)
Tables: `statement_periods`, `statement_lines` (long format: `period_id, key, value numeric(28,4), derived bool`), `price_bars_daily` (partitioned by year if large), `corporate_actions`, `key_stats_snapshots`, `quality_flags`. Idempotent upserts keyed by `(instrument_id, period_end, period_type, consolidation, key)`. Keep `raw_payload_id` pointer.

## 10. Tests
- Golden normalization fixtures for ≥ 2 instruments per region from recorded payloads, asserting exact canonical output.
- Property tests: `Money` arithmetic round-trips; currency mismatch throws.
- Pence test: LSE price `2,450 GBp` → `£24.50`; P/E uses £.
- India FY test: period ending `2025-03-31` → `FY2025`, Q4 ends Mar.
- Invariant tests with deliberately broken fixtures.

## 11. Multiple providers: provenance & mapping
- One mapping file **per provider** (`mappings/finnhub.ts`, `alphavantage.ts`, `yfinance.ts`): field names, units/scale, sign conventions and fiscal labelling differ. Record each provider's scale (units vs thousands vs millions) in the mapping and test it.
- Missing-value encodings differ: treat `"None"`, `"-"`, `""`, `NaN`, `null` as **missing**, never `0` (Alpha Vantage returns the string `"None"`; yfinance can return NaN/empty frames).
- Every canonical record and every `statement_lines` row stores `source` (provider id), `source_version` (adapter + library version), `retrieved_at`, `raw_payload_id`. The UI exposes source and retrieval time in the freshness tooltip.
- A statement time series has **one source** (see Phase 9 routing rule: never splice). A `SOURCE_CHANGED` event replaces the whole stored series atomically.
- Reconciliation results from Phase 9 (`PROVIDER_DISAGREE`) are stored as quality flags and shown in `/dev/quality`; they do not modify canonical values.
- Share counts, currency and fiscal-year-end are taken from the **same source** as the statements they apply to.

## Do not
Use floats for money; "fix" suspicious data silently; infer currency from the exchange when the provider supplies it; mix standalone and consolidated.

## Definition of Done
- [ ] All Phase 9 instruments normalise from **every** enabled provider with zero unmapped fields; each canonical record carries its `source`.
- [ ] All invariants implemented with tests; flagged examples visible in a dev dashboard (`/dev/quality`).
- [ ] Company-type classification verified on every seeded instrument.
- [ ] No `number` type used for money in `packages/types` (type-level test).

---
**Next:** `phase-11-historical-charts.md`
