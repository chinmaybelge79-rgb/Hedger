# Hedger — Data Sourcing, Licensing & Attribution (`docs/DATA_LICENCE.md`)

**Date:** 23 October 2026  
**Version:** 1.0 (Audited)  
**Governing Standard:** Financial Data Trust & Regulatory Compliance

---

## 1. Overview
Hedger is a research and valuation engine designed to deliver transparent, institutional-grade equity intelligence. Hedger strictly adheres to data provider licensing boundaries, transparent attribution, and real-time freshness signalling.

The browser never directly connects to external data providers. All data queries are authenticated, cached, normalized, and validated via the backend API gateway (`apps/api`).

---

## 2. Data Elements & Licensing Matrix

| Data Element | Primary Provider | Freshness Class | Redistribution / Usage Terms | User-Facing Attribution Line |
|---|---|---|---|---|
| **US Real-Time / Delayed Quotes** | Finnhub API | `LIVE` / `DELAYED 15m` | Permitted for display within research applications. Real-time for US major exchanges; delayed 15 minutes during regular sessions. | `"Market data provided by Finnhub. Quotes delayed at least 15 min unless marked LIVE."` |
| **Indian & Global Quotes** | yfinance Gateway / Exchange Feeds | `LIVE` / `DELAYED 15m` / `EOD` | Public market data ingest via server-side gateway. Intended for research, valuation modeling, and educational analysis. | `"Market data sourced from exchange feeds (NSE, BSE, LSE, TSE). Delayed 15 min."` |
| **Historical Price Bars (1M, 6M, 1Y, 5Y)** | yfinance Engine | `EOD` | Adjusted daily close, open, high, low, volume bars for historical trajectory analysis. | `"Historical price bars adjusted for stock splits and corporate actions."` |
| **Audited Financial Statements (Income, Balance Sheet, Cash Flow)** | Regulatory Filings (MCA, NSE, SEC EDGAR) | `ANNUAL` / `QUARTERLY` | Public regulatory submissions filed under statutory reporting mandates. Reconciled against audited annual reports. | `"Financial statements retrieved from statutory regulatory filings. R = restated."` |
| **Company Profile & Key Executives** | Corporate Disclosure Registry | `EOD` | Public entity corporate records, sector classification, business descriptions. | `"Corporate profile information from official public disclosures."` |
| **Intrinsic Value & Valuation Scenarios** | Hedger DCF & Valuation Engine (`@hedger/valuation`) | `CALCULATED` | Proprietary, server-side DCF, excess returns, and scenario engines. All calculations carry the $ƒ$ mark. | `"Intrinsic value is an algorithmic estimate based on user and baseline assumptions (ƒ). Not investment advice."` |
| **Peer Multiples & Relative Valuations** | Hedger Peer Correlation Engine | `CALCULATED` | Cross-sectional medians and peer distributions computed across identical industry classifications. | `"Peer ratios computed in each company’s own currency. ƒ = calculated."` |

---

## 3. Freshness Class Definitions

Every number displayed in Hedger carries an explicit, machine-readable and human-visible freshness tag:

1. `LIVE`: Real-time streaming or polling data updated within the current trading session (sub-minute latency).
2. `DELAYED 15m`: Standard exchange-mandated session delay (typically 15 minutes for NSE/BSE and US secondary feeds).
3. `EOD`: End-of-Day closing price or statistics finalized upon market session completion.
4. `ANNUAL`: Audited figures extracted from annual regulatory filings (10-K, Annual Report).
5. `QUARTERLY`: Unaudited or reviewed quarterly filings (10-Q, Q1-Q4 earnings releases).
6. `CALCULATED` ($ƒ$): Derived, algorithmic, or modeled metrics computed by Hedger from audited baseline facts.

---

## 4. Mandatory Legal Disclaimers

### 4.1 Global Investment Disclaimer
> **"Hedger is a financial research, educational, and valuation platform. Nothing on this platform constitutes an offer to buy or sell securities, investment advice, financial advisory services, or an endorsement of any company or security. Intrinsic values and scenario forecasts are mathematical projections based on selected assumptions and do not guarantee future performance. Past performance is no guarantee of future results. Consult a licensed financial advisor before making any investment decisions."**

### 4.2 Banking & Financial Institutions DCF Exclusion
> **"Industrial Discounted Cash Flow (DCF) models rely on Free Cash Flow to Firm (FCFF), which is not applicable to banks, insurance providers, or NBFCs because interest expense is an operating cost, working capital is non-standard, and debt cannot be separated from operational liabilities. For financial institutions, Hedger activates Equity-based Excess Returns and Price-to-Tangible Book Value (P/TBV) models."**

### 4.3 Missing & Outlier Data Standards
- Missing or non-reported figures are rendered as `—` (em-dash) with a tooltip reason on hover.
- Negative multiples or loss-making company P/E ratios are rendered as `NM` (Not Meaningful).
- Values exceeding statistical thresholds are tagged as `OUTLIER`.
- `null`, `undefined`, `NaN`, and `Infinity` are strictly banned from reaching the user interface.
