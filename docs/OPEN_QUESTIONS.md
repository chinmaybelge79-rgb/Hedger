# Open Questions & Resolution Roadmap — Hedger

This document tracks unresolved technical, licensing, and product questions, assigning each an owner and identifying the exact project phase where the resolution must be enacted.

---

| Item ID | Question / Uncertainty | Impact | Assigned Owner | Enactment Phase | Proposed Resolution |
|---|---|---|---|---|---|
| **OQ-01** | **Commercial Data Licensing:**<br>Finnhub free tier, Alpha Vantage free tier, and yfinance are designated for personal/research use. Can public commercial deployment proceed on these tiers? | Legal & Compliance | Tech Lead / Product Owner | **Phase 20** (Deployment) | For v1 prototype and personal use, current free tiers are operational. For a commercial public launch, swap to enterprise-licensed feeds (e.g. Polygon.io, Financial Modeling Prep, or LSEG) behind the unified `MarketDataProvider` interface. |
| **OQ-02** | **Session Storage Backend:**<br>Should user sessions and saved valuations use PostgreSQL or lightweight SQLite in local development? | Architecture & Ops | Backend Engineer | **Phase 18** (Accounts & Saved Analysis) | Use SQLite via Prisma / Kysely for simple zero-config local runs, with drop-in PostgreSQL compatibility for containerized cloud deployment. |
| **OQ-03** | **Exchange Rate Provider:**<br>When comparing cross-border peers (e.g. Indian IT vs. US Tech), what provider provides reliable FX spot rates? | Data Normalization | Data Engineer | **Phase 10** (Data Normalization) | Use Finnhub / yfinance forex pairs (e.g., `USDINR=X`) cached at 1-hour intervals for cross-currency normalization. |
| **OQ-04** | **Alpha Vantage Free Quota Reset Time:**<br>At what exact UTC time does the 25 calls/day counter reset for Alpha Vantage? | Quota Budgeter | Integration Engineer | **Phase 09** (Market Data Integration) | Probe verification in Phase 9 will log rate-limit headers. Default quota budgeter to conservative rolling 24-hour window. |
| **OQ-05** | **Hosting & Deployment Target:**<br>Where will the Node.js API, Python gateway, and static React frontend be hosted? | DevOps | DevOps Engineer | **Phase 20** (Deployment) | Docker Compose or unified PaaS (Render / Fly.io) running the Node API and Python gateway on a private internal bridge, with the React Vite frontend hosted on Cloudflare Pages or Vercel. |
