import React, { useState } from 'react';

interface PlatformServicesPromiseProps {
  onSelectPlan?: (plan: 'basic' | 'plus' | 'pro' | 'ultra') => void;
  currentPlan?: string;
  showCta?: boolean;
}

export const PlatformServicesPromise: React.FC<PlatformServicesPromiseProps> = ({
  onSelectPlan,
  currentPlan,
  showCta = false
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'data' | 'valuation' | 'ai' | 'simulation'>('all');

  const CheckSvg = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: '#16a34a' }} aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  const DashSvg = () => (
    <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>—</span>
  );

  const ShieldSvg = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );

  const TableSvg = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );

  const CpuSvg = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  );

  const ChartSvg = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );

  const GlobeSvg = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );

  const FileSvg = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );

  const servicePillars = [
    {
      id: 'market-data',
      category: 'data',
      title: 'Global Market Data & Real-Time Streaming',
      badge: 'Streaming SLA',
      icon: <GlobeSvg />,
      summary: '15,000+ securities across NSE, BSE, NASDAQ, NYSE, TSE, and HKEX with verifiable filing transparency.',
      promises: [
        'Real-time sub-second WebSocket quote streaming for NSE and US equities (Plus, Pro, Ultra).',
        '15-minute delayed market quotes with high-resolution historical charts (Basic Free).',
        '5 to 10 years of audited financial statements (Balance Sheet, P&L, Cash Flow) without synthetic fills.',
        'Global equity search with keyboard shortcut (Command-K) across all covered jurisdictions.'
      ]
    },
    {
      id: 'valuation-workbench',
      category: 'valuation',
      title: 'Deterministic Valuation Engines & Sensitivity',
      badge: 'Zero Drift',
      icon: <CpuSvg />,
      summary: 'Institutional multi-scenario discounted cash flow engines calculated with strict decimal precision.',
      promises: [
        '3 institutional DCF valuations per day on Basic; unlimited DCF and Reverse DCF on Plus, Pro, and Ultra.',
        'Reverse DCF implied growth engine calculating the revenue growth discounted by current market prices.',
        'Interactive 5x5 WACC vs growth sensitivity grid with real-time recalculation and mid-year discounting.',
        'Dual terminal value methodology: Perpetual Gordon Growth and Terminal Multiple triangulation.'
      ]
    },
    {
      id: 'peer-benchmarking',
      category: 'valuation',
      title: 'Cross-Border Peer Benchmarking & Normalization',
      badge: 'Fiscal Alignment',
      icon: <TableSvg />,
      summary: 'Direct side-by-side valuation multiple benchmarking across international market borders.',
      promises: [
        'Automatic synthetic FX currency conversion aligning domestic and international peer financials.',
        'Fiscal year normalization (e.g. reconciling Indian March-ending FY with US December-ending calendars).',
        'Standardized multiples suite: EV/EBITDA, P/E, P/FCF, EV/Sales, ROIC, and Capital Intensity.',
        'Full peer workbench included in Pro and Ultra tiers for institutional portfolio construction.'
      ]
    },
    {
      id: 'specialized-models',
      category: 'valuation',
      title: 'Specialized Multi-Model Financial Architecture',
      badge: 'Multi-Model',
      icon: <ChartSvg />,
      summary: 'Sector-calibrated models for capital structures that cannot be accurately valued via standard DCF.',
      promises: [
        'Banking & Financial Excess Returns model (Residual Income) for balance-sheet heavy financial institutions.',
        'Dividend Discount Model (DDM) for mature dividend compounders and regulated utilities.',
        'Custom WACC builder with Blume-adjusted and Hamada-unlevered betas in Pro and Ultra.',
        'Unlimited encrypted model state persistence and parameter assumptions saved to database.'
      ]
    },
    {
      id: 'ai-theses',
      category: 'ai',
      title: 'Hedger AI Investment Theses & Report Downloads',
      badge: 'Source-Audited AI',
      icon: <FileSvg />,
      summary: 'Autonomous equity research synthesis producing institutional-ready 18-section investment theses.',
      promises: [
        'Deterministic calculations with mandatory data tagging: [R] Reported, [C] Calculated, [E] Estimate, [F] Forecast, [A] AI Assessment.',
        'Unlimited fast-answering AI assistant for valuation concepts, statement breakdown, and financial health inquiries.',
        'Monthly thesis quotas: 3/mo (Plus), 25/mo (Pro), Unlimited (Ultra) with dedicated company dossier generation.',
        'Downloadable export formats: PDF, DOCX, CSV, Excel, Google Sheets, and Markdown with zero emojis.'
      ]
    },
    {
      id: 'stress-testing',
      category: 'simulation',
      title: 'Predictive Simulation & Risk Stress Testing',
      badge: 'Quantitative Rigor',
      icon: <ShieldSvg />,
      summary: 'Stochastic portfolio simulations and automated balance-sheet solvency audits for desks and funds.',
      promises: [
        '10,000-path Monte Carlo forward portfolio distributions and 95%/99% Value-at-Risk (VaR) estimations.',
        'Deterministic financial health audits: Altman Z-Score distress signaling and Piotroski F-Score accounting quality.',
        'Balance-sheet resilience checks: Net debt to EBITDA, interest coverage, and liquidity stress thresholds.',
        'Dedicated valuation methodology advisory and quantitative documentation support (Ultra).'
      ]
    }
  ];

  const comparisonRows = [
    // Category 1: Market Data & Discovery
    {
      category: 'Market Data & Global Discovery',
      items: [
        {
          name: 'Global screener coverage',
          desc: 'NSE, BSE, NASDAQ, NYSE, TSE, HKEX',
          basic: 'NSE, US, EU, Asia',
          plus: 'NSE, US, EU, Asia',
          pro: 'NSE, US, EU, Asia',
          ultra: 'NSE, US, EU, Asia'
        },
        {
          name: 'Market quote latency',
          desc: 'Price update speed and historical charts',
          basic: '15-min delayed',
          plus: 'Real-time streaming',
          pro: 'Real-time streaming',
          ultra: 'Real-time streaming'
        },
        {
          name: 'Audited financial statements',
          desc: 'Balance sheet, income statement, cash flow history',
          basic: '5 Years',
          plus: '10 Years',
          pro: '10 Years',
          ultra: '10 Years'
        },
        {
          name: 'Global equity search (Command-K)',
          desc: 'Instant symbol search across 15,000+ instruments',
          basic: 'included',
          plus: 'included',
          pro: 'included',
          ultra: 'included'
        },
        {
          name: 'Clean spreadsheet CSV data export',
          desc: 'One-click export of normalized statement data',
          basic: 'dash',
          plus: 'included',
          pro: 'included',
          ultra: 'included'
        }
      ]
    },
    // Category 2: Valuation Engines & Models
    {
      category: 'Valuation Engines & Sensitivity',
      items: [
        {
          name: 'Institutional DCF valuations',
          desc: '10-Year Pure Decimal DCF calculation engine',
          basic: '3 per day',
          plus: 'Unlimited',
          pro: 'Unlimited',
          ultra: 'Unlimited'
        },
        {
          name: 'Reverse DCF implied growth',
          desc: 'Solves for market-discounted revenue CAGR',
          basic: 'dash',
          plus: 'Unlimited',
          pro: 'Unlimited',
          ultra: 'Unlimited'
        },
        {
          name: 'Interactive 5x5 WACC vs growth grid',
          desc: 'Dual-variable valuation sensitivity matrix',
          basic: 'dash',
          plus: 'Interactive',
          pro: 'Interactive',
          ultra: 'Interactive'
        },
        {
          name: 'Banking Excess Returns & DDM models',
          desc: 'Specialized residual income and dividend models',
          basic: 'dash',
          plus: 'dash',
          pro: 'included',
          ultra: 'included'
        },
        {
          name: 'Custom WACC & capital structure builder',
          desc: 'Hamada unlevered beta and debt-equity optimization',
          basic: 'dash',
          plus: 'dash',
          pro: 'Standard',
          ultra: 'Advanced'
        },
        {
          name: 'Model persistence & parameter notes',
          desc: 'Encrypted database saving for customized scenarios',
          basic: 'dash',
          plus: '5 saved models',
          pro: 'Unlimited',
          ultra: 'Unlimited'
        }
      ]
    },
    // Category 3: AI Intelligence & Theses
    {
      category: 'Hedger AI Intelligence & Theses',
      items: [
        {
          name: 'Fast Answering AI Chatbot',
          desc: 'Unlimited queries for formulas, theories, and metrics',
          basic: 'Unlimited',
          plus: 'Unlimited',
          pro: 'Unlimited',
          ultra: 'Unlimited'
        },
        {
          name: 'AI Investment Thesis generation',
          desc: 'Institutional 18-section research reports',
          basic: 'Preview only',
          plus: '3 / month',
          pro: '25 / month',
          ultra: 'Unlimited'
        },
        {
          name: 'Thesis report downloads',
          desc: 'Exportable full dossiers (PDF, DOCX, CSV, MD, Sheets)',
          basic: 'dash',
          plus: '1 / month',
          pro: '10 / month',
          ultra: '20 / month'
        },
        {
          name: 'Export formats supported',
          desc: 'Clean templated institutional formats',
          basic: 'dash',
          plus: 'PDF, DOCX, CSV, Sheets, MD',
          pro: 'PDF, DOCX, CSV, Sheets, MD',
          ultra: 'PDF, DOCX, CSV, Sheets, MD'
        },
        {
          name: 'Deterministic financial health audits',
          desc: 'Altman Z-Score, Piotroski F-Score, solvency checks',
          basic: 'Standard',
          plus: 'Standard',
          pro: 'In-Depth',
          ultra: 'Comprehensive'
        }
      ]
    },
    // Category 4: Institutional Simulation & Analytics
    {
      category: 'Cross-Border Benchmarking & Risk',
      items: [
        {
          name: 'Cross-Border Peer Comparison Workbench',
          desc: 'Multi-company international valuation matrix',
          basic: 'dash',
          plus: 'dash',
          pro: 'included',
          ultra: 'included'
        },
        {
          name: 'Automatic FX conversion & FY alignment',
          desc: 'Normalized currency and fiscal calendar syncing',
          basic: 'dash',
          plus: 'dash',
          pro: 'included',
          ultra: 'included'
        },
        {
          name: 'Forward Portfolio Prediction & Monte Carlo',
          desc: '10,000-iteration stochastic risk stress testing',
          basic: 'dash',
          plus: 'dash',
          pro: 'dash',
          ultra: 'included'
        },
        {
          name: 'Valuation calculation SLA',
          desc: 'Execution speed and numerical consistency guarantee',
          basic: 'Sub-second (0% drift)',
          plus: 'Sub-second (0% drift)',
          pro: 'Sub-second (0% drift)',
          ultra: 'Sub-second (0% drift)'
        },
        {
          name: 'Valuation methodology support',
          desc: 'Institutional research documentation & model support',
          basic: 'Community Docs',
          plus: 'Standard Support',
          pro: 'Priority Desk',
          ultra: 'Dedicated Lead'
        }
      ]
    }
  ];

  const filteredPillars = activeCategory === 'all'
    ? servicePillars
    : servicePillars.filter(p => p.category === activeCategory);

  const renderValue = (val: string) => {
    if (val === 'included') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <CheckSvg />
        </div>
      );
    }
    if (val === 'dash') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <DashSvg />
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', textAlign: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.35, wordBreak: 'break-word', display: 'inline-block' }}>
          {val}
        </span>
      </div>
    );
  };

  return (
    <div style={{ marginTop: '64px', marginBottom: '48px' }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '16px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-muted)',
            marginBottom: '12px'
          }}
        >
          <ShieldSvg />
          <span>Institutional Service Commitments</span>
        </div>
        <h2
          style={{
            fontSize: 'clamp(24px, 3.5vw, 32px)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: 'var(--text)',
            margin: '0 0 10px 0'
          }}
        >
          Services We Promise to Deliver
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            maxWidth: '680px',
            margin: '0 auto',
            lineHeight: 1.5
          }}
        >
          Every feature promised across our membership tiers is backed by deterministic mathematical engines, audited regulatory filings, and explicit service-level performance guarantees.
        </p>
      </div>

      {/* Filter Chips */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '24px'
        }}
      >
        {[
          { key: 'all', label: 'All Services' },
          { key: 'data', label: 'Market Data & Filings' },
          { key: 'valuation', label: 'Valuation & Benchmarking' },
          { key: 'ai', label: 'Hedger AI & Theses' },
          { key: 'simulation', label: 'Monte Carlo & Risk' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveCategory(tab.key as any)}
            style={{
              height: '36px',
              padding: '0 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: activeCategory === tab.key ? 600 : 500,
              border: '1px solid',
              borderColor: activeCategory === tab.key ? 'var(--accent, #1D1D1F)' : 'var(--border)',
              backgroundColor: activeCategory === tab.key ? 'var(--accent, #1D1D1F)' : 'var(--surface)',
              color: activeCategory === tab.key ? 'var(--bg, #FFFFFF)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Visual Service Guarantee Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
          marginBottom: '48px'
        }}
      >
        {filteredPillars.map((pillar) => (
          <div
            key={pillar.id}
            className="card"
            style={{
              padding: '24px',
              backgroundColor: 'var(--card-bg, #09090b)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)'
                  }}
                >
                  {pillar.icon}
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)'
                  }}
                >
                  {pillar.badge}
                </span>
              </div>

              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', margin: '0 0 8px 0' }}>
                {pillar.title}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                {pillar.summary}
              </p>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pillar.promises.map((promise, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', lineHeight: 1.4, color: 'var(--text)' }}>
                    <div style={{ marginTop: '2px' }}><CheckSvg /></div>
                    <span>{promise}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Comparison Matrix Section */}
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: '12px',
          backgroundColor: 'var(--card-bg, #09090b)',
          overflow: 'hidden',
          marginBottom: '48px'
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px 0' }}>
              Full Service & Capability Comparison Matrix
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Direct line-item verification of all promised deliverables across Basic, Plus, Pro, and Ultra.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckSvg /> Included
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <DashSvg /> Not Available
            </span>
          </div>
        </div>

        {/* Responsive Table Container */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '820px', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '36%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '16%' }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', textAlign: 'left' }}>
                  Platform Capability / Service
                </th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text)', textAlign: 'center' }}>
                  Basic (Free)
                </th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text)', textAlign: 'center' }}>
                  Plus ($9.99)
                </th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent, #1D1D1F)', textAlign: 'center', backgroundColor: 'rgba(29, 29, 31, 0.04)' }}>
                  Pro ($19.99)
                </th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text)', textAlign: 'center' }}>
                  Ultra ($49.99)
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((cat, catIdx) => (
                <React.Fragment key={catIdx}>
                  {/* Category Section Header */}
                  <tr style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                    <td
                      colSpan={5}
                      style={{
                        padding: '10px 16px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {cat.category}
                    </td>
                  </tr>
                  {/* Category Items */}
                  {cat.items.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '13px 16px', verticalAlign: 'middle', textAlign: 'left' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                          {row.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                          {row.desc}
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                        {renderValue(row.basic)}
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                        {renderValue(row.plus)}
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'center', verticalAlign: 'middle', backgroundColor: 'rgba(29, 29, 31, 0.02)' }}>
                        {renderValue(row.pro)}
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                        {renderValue(row.ultra)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Bottom Action Bar (if CTA enabled) */}
        {showCta && onSelectPlan && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Ready to upgrade your research capability? Select a plan to start immediately.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => onSelectPlan('basic')}
                className="btn btn-secondary"
                style={{ height: '36px', minHeight: '36px', padding: '0 12px', fontSize: '12px' }}
              >
                Free
              </button>
              <button
                onClick={() => onSelectPlan('plus')}
                className="btn btn-secondary"
                style={{ height: '36px', minHeight: '36px', padding: '0 12px', fontSize: '12px' }}
              >
                Plus ($9.99)
              </button>
              <button
                onClick={() => onSelectPlan('pro')}
                className="btn btn-primary"
                style={{ height: '36px', minHeight: '36px', padding: '0 16px', fontSize: '12px', fontWeight: 600 }}
              >
                Pro ($19.99)
              </button>
              <button
                onClick={() => onSelectPlan('ultra')}
                className="btn btn-secondary"
                style={{ height: '36px', minHeight: '36px', padding: '0 12px', fontSize: '12px' }}
              >
                Ultra ($49.99)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Institutional SLA & Performance Guarantees Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          <div style={{ marginTop: '2px', color: '#16a34a' }}><CheckSvg /></div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
              99.9% Valuation Engine Uptime
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              High-availability compute cluster with sub-second pure decimal calculation throughput.
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '16px 20px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          <div style={{ marginTop: '2px', color: '#16a34a' }}><CheckSvg /></div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
              Zero Synthetic Figure Drift
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              All ratios and intrinsic share values derive strictly from audited regulatory statements.
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '16px 20px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          <div style={{ marginTop: '2px', color: '#16a34a' }}><CheckSvg /></div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
              AES-256 Encrypted Model State
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Custom assumptions, parameter notes, and portfolio weights remain private and secure.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
