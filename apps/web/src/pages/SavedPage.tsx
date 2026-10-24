import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyPath } from '../lib/navigation.js';

interface SavedModel {
  id: string;
  name: string;
  symbol: string;
  savedDate: string;
  priceAtSave: string;
  intrinsicValue: string;
  marginOfSafety: string;
  isUp: boolean;
  notes: string;
  assumptions: string;
}

export const SavedPage: React.FC = () => {
  const navigate = useNavigate();

  const [models, setModels] = useState<SavedModel[]>([
    {
      id: '1',
      name: 'Reliance Industries',
      symbol: 'RELIANCE.NS',
      savedDate: '12 Oct 2026',
      priceAtSave: '₹1,402.00',
      intrinsicValue: '₹1,588',
      marginOfSafety: '+13.3%',
      isUp: true,
      notes: 'Retail and digital growth offset the energy cycle.',
      assumptions: 'WACC 11.75% · g 4.0% · margin 15% · growth 12%'
    },
    {
      id: '2',
      name: 'Tata Consultancy Services',
      symbol: 'TCS.NS',
      savedDate: '2 Oct 2026',
      priceAtSave: '₹3,512.00',
      intrinsicValue: '₹3,290',
      marginOfSafety: '−6.3%',
      isUp: false,
      notes: 'Quality compounder, but the price already assumes a lot.',
      assumptions: 'WACC 11.0% · g 4.0% · margin 24% · growth 9%'
    },
    {
      id: '3',
      name: 'Apple Inc.',
      symbol: 'AAPL',
      savedDate: '25 Sep 2026',
      priceAtSave: '$231.00',
      intrinsicValue: '$246',
      marginOfSafety: '+6.5%',
      isUp: true,
      notes: 'Services mix lifts margins; watch the hardware cycle.',
      assumptions: 'WACC 8.5% · g 3.0% · margin 31% · growth 7%'
    }
  ]);

  const deleteModel = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setModels((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 className="page-title">Saved models</h1>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 500,
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'var(--secondary)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)'
              }}
            >
              {models.length} saved
            </span>
          </div>
          <p className="page-subtitle">
            Your valuation snapshots, exactly as you left them
          </p>
        </div>
      </div>

      {/* 2-Column Cards Grid (Spec: Card padding 24; gap between cards 16) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}
      >
        {models.map((item) => (
          <div
            key={item.id}
            className="card"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '260px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)' }}>
                    {item.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {item.symbol} · Saved {item.savedDate}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Intrinsic value</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)' }} className="tnum">
                    {item.intrinsicValue}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: item.isUp ? 'var(--positive)' : 'var(--negative)' }}>
                    {item.marginOfSafety} MoS
                  </div>
                </div>
              </div>

              {/* Notes */}
              <p style={{ fontSize: '13px', lineHeight: '20px', color: 'var(--foreground)', marginBottom: '14px', fontStyle: 'italic' }}>
                “{item.notes}”
              </p>

              {/* Assumptions */}
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                {item.assumptions}
              </div>
            </div>

            {/* Actions Bar (Spec: Controls height 44; gap >= 12) */}
            <div className="controls-group" style={{ gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => navigate(companyPath(item.symbol) + '?tab=valuation')}
                className="btn btn-primary"
                style={{ height: '44px', minHeight: '44px', padding: '0 16px', fontSize: '13px' }}
              >
                Reopen model
              </button>
              <button
                onClick={(e) => deleteModel(item.id, e)}
                className="btn btn-secondary"
                style={{ height: '44px', minHeight: '44px', padding: '0 16px', fontSize: '13px', color: 'var(--negative)' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {/* Empty placeholder card */}
        <div
          style={{
            border: '1px dashed var(--border)',
            borderRadius: '10px',
            padding: '24px',
            backgroundColor: 'var(--secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            minHeight: '260px'
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px', color: 'var(--text-muted)' }}>
            ☆
          </div>
          <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
            Save models from any company page
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '280px', lineHeight: '20px', marginBottom: '20px' }}>
            Adjust WACC, margins and terminal growth on any company, then hit Save to keep your exact assumptions.
          </p>
          <button
            onClick={() => navigate(companyPath('RELIANCE.NS') + '?tab=valuation')}
            className="btn btn-secondary"
            style={{ height: '44px', minHeight: '44px', padding: '0 16px', fontSize: '13px' }}
          >
            Try on Reliance Industries
          </button>
        </div>
      </div>
    </div>
  );
};
