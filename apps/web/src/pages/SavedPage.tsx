import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyPath } from '../lib/navigation.js';
import { CompanyLogo } from '../components/CompanyLogo.js';
import { getFamousSecuritySuggestions } from '../lib/famousSecurities.js';

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

function mapDbModelToSavedModel(m: any): SavedModel {
  const currencySymbol = m.currency === 'INR' ? '₹' : m.currency === 'EUR' ? '€' : m.currency === 'GBP' ? '£' : '$';
  const price = typeof m.priceAtSave === 'number' ? m.priceAtSave : parseFloat(m.priceAtSave) || 0;
  const iv = typeof m.intrinsicValuePerShare === 'number' ? m.intrinsicValuePerShare : parseFloat(m.intrinsicValuePerShare) || 0;
  const mos = typeof m.marginOfSafety === 'number' ? m.marginOfSafety : parseFloat(m.marginOfSafety) || 0;
  const isUp = mos >= 0;
  const mosText = `${isUp ? '+' : ''}${(mos * 100).toFixed(1)}%`;

  let savedDateStr = 'Recent';
  if (m.savedAt) {
    try {
      const d = new Date(m.savedAt);
      savedDateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      savedDateStr = m.savedAt;
    }
  }

  let assumptionsStr = '';
  if (m.inputs) {
    const parts: string[] = [];
    if (m.inputs.wacc !== undefined) parts.push(`WACC ${(Number(m.inputs.wacc) * 100).toFixed(1)}%`);
    if (m.inputs.terminalGrowthRate !== undefined) parts.push(`g ${(Number(m.inputs.terminalGrowthRate) * 100).toFixed(1)}%`);
    if (m.inputs.ebitMargin !== undefined) parts.push(`EBIT margin ${(Number(m.inputs.ebitMargin) * 100).toFixed(1)}%`);
    if (m.inputs.growthRate !== undefined) parts.push(`growth ${(Number(m.inputs.growthRate) * 100).toFixed(1)}%`);
    assumptionsStr = parts.join(' · ') || (m.engineVersion || 'DCF Model');
  } else {
    assumptionsStr = m.engineVersion || 'DCF Model';
  }

  return {
    id: m.id,
    name: m.name || m.symbol,
    symbol: m.symbol,
    savedDate: savedDateStr,
    priceAtSave: `${currencySymbol}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    intrinsicValue: `${currencySymbol}${iv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    marginOfSafety: mosText,
    isUp,
    notes: m.notes || 'Custom valuation assumptions snapshot.',
    assumptions: assumptionsStr
  };
}

export const SavedPage: React.FC = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState<SavedModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & suggestions state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLDivElement>(null);

  // Dismiss suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dismiss suggestions on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/v1/saved')
      .then((res) => (res.ok ? res.json() : { saved: [] }))
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data?.saved)) {
          setModels(data.saved.map(mapDbModelToSavedModel));
        } else {
          setModels([]);
        }
      })
      .catch(() => {
        if (isMounted) setModels([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const deleteModel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/v1/saved/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
    setModels((prev) => prev.filter((m) => m.id !== id));
  };

  const filteredModels = models.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      item.symbol.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.notes.toLowerCase().includes(q) ||
      item.assumptions.toLowerCase().includes(q)
    );
  });

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

      {/* Search & Suggestions Bar */}
      <div ref={searchInputRef} style={{ position: 'relative', marginBottom: '24px', maxWidth: '520px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)', pointerEvents: 'none' }}
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search saved models or lookup famous security (e.g. AAPL, NVDA)..."
            style={{
              width: '100%',
              height: '40px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg, #FFFFFF)',
              paddingLeft: '40px',
              paddingRight: '16px',
              fontSize: '13px',
              color: 'var(--text)',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Floating Suggestions Dropdown */}
        {showSuggestions && searchQuery.trim().length > 0 && (
          <div
            data-testid="saved-page-suggestions-dropdown"
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              width: '100%',
              backgroundColor: 'var(--card-bg, #FFFFFF)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.14)',
              zIndex: 60,
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                backgroundColor: 'var(--bg-subtle, #FAFAFC)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>Famous Securities for "{searchQuery}"</span>
              <span>Valuation Launcher</span>
            </div>
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {getFamousSecuritySuggestions(searchQuery, 6).map((item) => (
                <div
                  key={item.symbol}
                  data-testid={`saved-page-suggestion-${item.symbol}`}
                  onClick={() => {
                    setShowSuggestions(false);
                    navigate(`${companyPath(item.symbol)}?tab=valuation`);
                  }}
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.12s ease'
                  }}
                  className="hover:bg-[var(--bg-hover)]"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <CompanyLogo symbol={item.symbol} name={item.name} size={24} withContainer rounded />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                          {item.symbol}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--secondary)',
                            color: 'var(--text-muted)',
                            fontFamily: 'monospace'
                          }}
                        >
                          {item.exchange}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '240px'
                        }}
                      >
                        {item.name} · {item.sector}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      height: '28px',
                      minHeight: '28px',
                      padding: '0 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--primary)'
                    }}
                  >
                    Open Model →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Loading saved models...
        </div>
      ) : models.length === 0 ? (
        <div
          style={{
            border: '1px dashed var(--border)',
            borderRadius: '12px',
            padding: '48px 24px',
            backgroundColor: 'var(--card-bg, #FFFFFF)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            marginBottom: '32px'
          }}
        >
          <div style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>
            No saved valuation models yet
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: '20px', marginBottom: '20px' }}>
            Adjust WACC, margins, and terminal growth on any company dossier, then save to keep your exact valuation snapshots.
          </p>
          <button
            onClick={() => navigate('/screener')}
            className="btn btn-primary"
            style={{ height: '40px', minHeight: '40px', padding: '0 20px', fontSize: '13px' }}
          >
            Browse Market Securities
          </button>
        </div>
      ) : filteredModels.length === 0 ? (
        <div
          style={{
            border: '1px dashed var(--border)',
            borderRadius: '12px',
            padding: '32px 24px',
            backgroundColor: 'var(--card-bg, #FFFFFF)',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '13px',
            marginBottom: '32px'
          }}
        >
          No saved models match &ldquo;{searchQuery}&rdquo;. Try another symbol or open a new valuation using the suggestions above.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}
        >
          {filteredModels.map((item) => (
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

              {/* Actions Bar */}
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

          {/* Additional card to explore and save more */}
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
            <div style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
              Save models from any company dossier
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '280px', lineHeight: '20px', marginBottom: '20px' }}>
              Adjust WACC, margins and terminal growth on any company, then hit Save to keep your exact assumptions.
            </p>
            <button
              onClick={() => navigate('/screener')}
              className="btn btn-secondary"
              style={{ height: '44px', minHeight: '44px', padding: '0 16px', fontSize: '13px' }}
            >
              Browse Screener
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
