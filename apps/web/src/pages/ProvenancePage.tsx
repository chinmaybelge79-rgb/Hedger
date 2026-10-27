import React from 'react';
import { Link } from 'react-router-dom';

export const ProvenancePage: React.FC = () => {
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
            <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>Data Provenance</span>
          </nav>

          <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--foreground)', margin: '0 0 12px 0' }}>
            Audited Data Provenance & Methodology
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '780px', lineHeight: 1.5, margin: 0 }}>
            Every financial figure on Hedger is extracted directly from verified regulatory filings without synthetic interpolation, approximation, or AI hallucination.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container" style={{ padding: '40px 0 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '880px' }}>
          
          {/* Pillar 1: Zero Fabricated Figures */}
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
                Pillar 1
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                Zero Fabricated Data Guarantee
              </h2>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
              Hedger guarantees that missing fundamental figures render an explicit dash (—) rather than synthetic linear interpolation or statistical imputation. Each accounting line item retains its original reported scale, filing source, currency denomination, and filing timestamp.
            </p>
          </div>

          {/* Pillar 2: Direct Regulatory Filings */}
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
                Pillar 2
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                Direct Regulatory Disclosures
              </h2>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: '16px' }}>
              Fundamentals are ingested strictly from primary statutory sources across global jurisdictions:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--foreground)', marginBottom: '4px' }}>United States (SEC)</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Form 10-K (Annual), Form 10-Q (Quarterly), Form 8-K (Current Material Events) via EDGAR.</div>
              </div>
              <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--foreground)', marginBottom: '4px' }}>India (NSE & BSE)</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Audited Standalone and Consolidated Financial Results filed under SEBI (LODR) Regulations.</div>
              </div>
              <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--foreground)', marginBottom: '4px' }}>Japan & APAC (TSE & HKEX)</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Yuho (Securities Reports) via EDINET; HKEX Announcements under Listing Rules.</div>
              </div>
            </div>
          </div>

          {/* Pillar 3: Currency Invariants */}
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
                Pillar 3
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                Cross-Border Currency & Yield Invariants
              </h2>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
              Cash flow projections, sovereign discount rate hurdles, debt bridges, and per-share intrinsic values maintain strictly identical currency within each valuation model. INR cash flows are discounted against Indian 10-year G-Sec sovereign yields; USD cash flows against US Treasury yields; JPY against Japanese Government Bond yields. No mixed-currency errors are permitted.
            </p>
          </div>

          {/* Pillar 4: Deterministic Audit Trail */}
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
                Pillar 4
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                Auditable Formula Verification
              </h2>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: '16px' }}>
              Every calculation executed by the valuation engine exposes full intermediate mathematical steps, discount factors, reinvestment rates, and balance sheet bridge items.
            </p>
            <Link
              to="/models"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--foreground)',
                textDecoration: 'underline'
              }}
            >
              <span>Review Mathematical Specifications in Models Directory</span>
              <span>→</span>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
};
