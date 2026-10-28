import React from 'react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header Container */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          padding: '40px 0 32px'
        }}
      >
        <div className="page-container" style={{ paddingBlock: 0 }}>
          {/* Breadcrumbs */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>Terms of Service</span>
          </nav>

          <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--foreground)', margin: '0 0 12px 0' }}>
            Terms of Service & Regulatory Disclaimers
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '780px', lineHeight: 1.5, margin: 0 }}>
            Regulatory disclosures, research terminal governance, institutional privacy protections, and exchange licensing policies.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container" style={{ padding: '40px 0 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '880px' }}>
          
          {/* Section 1: Non-Advisory Notice */}
          <div
            style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg, #09090b)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)'
                }}
              >
                Disclaimer
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                Mathematical Estimations — Not Investment Advice
              </h2>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
              Hedger is an independent institutional equity analytics and valuation modeling terminal. All intrinsic valuations, fair value bounds, sensitivity matrices, cost of capital figures, and forward projections are deterministic mathematical computations based on user-supplied assumptions and public regulatory filings. Hedger does not issue investment advice, stock recommendations, buy/sell/hold ratings, or target prices.
            </p>
          </div>

          {/* Section 2: Privacy Guarantee */}
          <div
            style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg, #09090b)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)'
                }}
              >
                Confidentiality
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                Institutional Privacy Protections
              </h2>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              Custom assumptions, portfolio watchlists, and proprietary model parameters are retained strictly within local device storage or private, encrypted session contexts. Hedger maintains zero advertising trackers, third-party analytics beacons, or behavioral broker monetization. Your financial research workflows remain confidential.
            </p>
            <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text-muted)', margin: 0 }}>
              For complete details on Google OAuth user data protections, GDPR/CCPA rights, and data retention policies, review our dedicated{' '}
              <Link to="/privacy" style={{ color: 'var(--foreground)', fontWeight: 600, textDecoration: 'underline' }}>
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          {/* Section 3: Market Data Latency */}
          <div
            style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg, #09090b)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)'
                }}
              >
                Market Data
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                Market Data Feeds & Latency
              </h2>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
              Real-time quotes are provided for active trading sessions where permitted under exchange distribution licenses. Certain international equity feeds may reflect standard 15-minute regulatory delays as mandated by exchange authorities (including NSE, BSE, NASDAQ, NYSE, TSE, and HKEX).
            </p>
          </div>

          {/* Section 4: Acceptable Use */}
          <div
            style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg, #09090b)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)'
                }}
              >
                Governance
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                Service Governance & Acceptable Use
              </h2>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
              Subscribers agree not to reverse engineer or systematically extract raw tick feeds in violation of exchange intellectual property rights. Analytical outputs and reports generated through the DCF Workbench may be incorporated into internal institutional investment committee materials.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
};
