import React from 'react';
import { HedgerLogo } from './HedgerLogo.js';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--bg, #FFFFFF)',
        marginTop: '64px',
        padding: '40px 0 48px'
      }}
    >
      <div
        className="page-container"
        style={{
          paddingBlock: 0,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '24px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <HedgerLogo size={20} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              Hedger Terminal
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '520px', lineHeight: 1.5 }}>
            Independent institutional equity research and valuation terminal. Financial models are mathematical estimations, not investment advice. Audited fundamentals with zero fabricated figures.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <a href="#pricing" style={{ color: 'inherit' }}>Pricing</a>
          <span style={{ cursor: 'pointer' }}>Methodology</span>
          <span style={{ cursor: 'pointer' }}>Data Provenance</span>
          <span style={{ cursor: 'pointer' }}>API Documentation</span>
          <span style={{ cursor: 'pointer' }}>Terms & Privacy</span>
        </div>
      </div>
    </footer>
  );
};
