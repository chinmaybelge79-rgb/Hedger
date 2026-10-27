import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyPath } from '../lib/navigation.js';
import { CompanyLogo } from './CompanyLogo.js';
import { useMarket } from '../context/MarketContext.js';

interface SearchItem {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  country?: string;
  aliases?: string[];
}

const KNOWN_SEARCH_SECURITIES: SearchItem[] = [
  { symbol: '7203.T', name: 'Toyota Motor Corporation', exchange: 'TSE', currency: 'JPY', country: 'Japan', aliases: ['toyota', 'toyota motor', '7203'] },
  { symbol: '9984.T', name: 'SoftBank Group Corp.', exchange: 'TSE', currency: 'JPY', country: 'Japan', aliases: ['softbank', 'softbank group', '9984'] },
  { symbol: '9988.HK', name: 'Alibaba Group Holding Limited', exchange: 'HKEX', currency: 'HKD', country: 'China', aliases: ['alibaba', 'baba', 'alibaba group', '9988'] },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', currency: 'USD', country: 'US', aliases: ['nvidia'] },
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', currency: 'USD', country: 'US', aliases: ['apple'] },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', currency: 'USD', country: 'US', aliases: ['microsoft'] },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', exchange: 'NASDAQ', currency: 'USD', country: 'US', aliases: ['amazon'] },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', currency: 'USD', country: 'US', aliases: ['google', 'alphabet'] },
  { symbol: 'META', name: 'Meta Platforms, Inc.', exchange: 'NASDAQ', currency: 'USD', country: 'US', aliases: ['meta', 'facebook'] },
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited', exchange: 'NSE', currency: 'INR', country: 'India', aliases: ['reliance', 'ril'] },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE', currency: 'INR', country: 'India', aliases: ['tcs', 'tata'] },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', exchange: 'NSE', currency: 'INR', country: 'India', aliases: ['hdfc', 'hdfc bank'] },
  { symbol: 'INFY.NS', name: 'Infosys Limited', exchange: 'NSE', currency: 'INR', country: 'India', aliases: ['infosys', 'infy'] },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', currency: 'USD', country: 'US', aliases: ['jpmorgan', 'chase', 'jpm'] },
  { symbol: 'ASML', name: 'ASML Holding N.V.', exchange: 'EURONEXT', currency: 'EUR', country: 'Europe', aliases: ['asml'] },
  { symbol: 'SAP', name: 'SAP SE', exchange: 'XETRA', currency: 'EUR', country: 'Europe', aliases: ['sap'] }
];

export const SearchModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const {
    activeMarket,
    setActiveMarket,
    marketConfig,
    allMarkets,
    isInstrumentInActiveMarket
  } = useMarket();

  // Focus input and set market-specific default recommendations on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      // Populate defaults from active market's curated tickers
      const defaults: SearchItem[] = marketConfig.quickTickers.map((t) => ({
        symbol: t.symbol,
        name: t.name,
        exchange: t.exchange,
        currency: t.currency,
        country: activeMarket === 'in' ? 'India' : activeMarket === 'us' ? 'US' : 'Global'
      }));
      setResults(defaults);
      setSelectedIndex(0);
    }
  }, [isOpen, activeMarket, marketConfig]);

  // Global ESC key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  // Debounced search with market-specific filtering
  useEffect(() => {
    if (!query.trim()) {
      const defaults: SearchItem[] = marketConfig.quickTickers.map((t) => ({
        symbol: t.symbol,
        name: t.name,
        exchange: t.exchange,
        currency: t.currency,
        country: activeMarket === 'in' ? 'India' : activeMarket === 'us' ? 'US' : 'Global'
      }));
      setResults(defaults);
      return;
    }

    const term = query.trim().toLowerCase();
    const localMatches = KNOWN_SEARCH_SECURITIES.filter(
      (s) =>
        (s.symbol.toLowerCase().includes(term) ||
          s.name.toLowerCase().includes(term) ||
          s.aliases?.some((a) => a.toLowerCase().includes(term) || term.includes(a.toLowerCase()))) &&
        isInstrumentInActiveMarket(s)
    );
    if (localMatches.length > 0) {
      setResults(localMatches);
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/instruments/search?q=${encodeURIComponent(query.trim())}&market=${encodeURIComponent(activeMarket)}`);
        if (res.ok) {
          const data: SearchItem[] = await res.json();
          // Filter strictly to current market
          const filtered = data.filter(isInstrumentInActiveMarket);
          const seen = new Set<string>();
          const combined: SearchItem[] = [];
          for (const item of [...localMatches, ...filtered]) {
            const symUpper = item.symbol.toUpperCase();
            if (!seen.has(symUpper)) {
              seen.add(symUpper);
              const canonical = KNOWN_SEARCH_SECURITIES.find((k) => k.symbol.toUpperCase() === symUpper);
              combined.push(canonical || item);
            }
          }
          setResults(combined);
          setSelectedIndex(0);
        }
      } catch {
        // fallback
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [query, activeMarket, marketConfig, isInstrumentInActiveMarket]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[selectedIndex];
      if (target) {
        onClose();
        navigate(companyPath(target.symbol));
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Spotlight Equity Search"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.32)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px',
        paddingLeft: '16px',
        paddingRight: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '580px',
          backgroundColor: 'var(--popover)',
          borderRadius: '14px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.14)',
          overflow: 'hidden',
          border: '1px solid var(--border)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Box (Height 44 min touch target) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderBottom: '1px solid var(--border)', minHeight: '44px' }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Search ${marketConfig.shortName} companies…`}
            className="search-modal-input"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              background: 'transparent',
              fontSize: '15px',
              color: 'var(--foreground)',
              fontWeight: 400,
              minHeight: '36px',
              padding: 0,
              margin: 0
            }}
          />
          <kbd
            onClick={onClose}
            style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              fontWeight: 600,
              color: 'var(--text-muted)',
              padding: '4px 8px',
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--secondary)',
              cursor: 'pointer',
              userSelect: 'none',
              flexShrink: 0
            }}
            title="Press Escape or click to close"
          >
            ESC
          </kbd>
        </div>

        {/* Market Filter Switcher Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 20px',
            backgroundColor: 'var(--bg-subtle, var(--secondary))',
            borderBottom: '1px solid var(--border)',
            overflowX: 'auto',
            scrollbarWidth: 'none'
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginRight: '4px', whiteSpace: 'nowrap' }}>
            Market:
          </span>
          {allMarkets.map((m) => {
            const isCurrent = m.id === activeMarket;
            return (
              <button
                key={m.id}
                data-testid={`search-market-tab-${m.id}`}
                onClick={() => setActiveMarket(m.id)}
                style={{
                  height: '24px',
                  padding: '0 8px',
                  borderRadius: '4px',
                  border: isCurrent ? '1px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: isCurrent ? 'var(--card)' : 'transparent',
                  color: isCurrent ? 'var(--foreground)' : 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: isCurrent ? 600 : 400,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.12s ease'
                }}
              >
                <span>{m.shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Category Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px 6px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
          <span>
            {query.trim() ? `Search Results in ${marketConfig.shortName}` : `Top ${marketConfig.shortName} Equities`}
          </span>
          <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>
            {results.length} found
          </span>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '4px 8px' }}>
          {results.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)', marginBottom: '4px' }}>
                No {marketConfig.shortName} companies found
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 12px' }}>
                No active securities in {marketConfig.name} match "{query}".
              </p>
              <button
                onClick={() => setActiveMarket('all')}
                style={{
                  height: '32px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--foreground)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Search across all global markets →
              </button>
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.symbol}
                  onClick={() => {
                    onClose();
                    navigate(companyPath(item.symbol));
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    minHeight: '44px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--secondary)' : 'transparent',
                    transition: 'background-color 0.1s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CompanyLogo symbol={item.symbol} name={item.name} size={28} withContainer rounded />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {item.symbol} · {item.exchange} · {item.currency}
                      </div>
                    </div>
                  </div>

                  {idx === 0 && !query.trim() && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--secondary)'
                      }}
                    >
                      Featured
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Keyboard Navigation Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--secondary)',
            fontSize: '12px',
            color: 'var(--text-muted)'
          }}
        >
          <span>
            <strong style={{ color: 'var(--foreground)', fontWeight: 500 }}>↑↓</strong> navigate
          </span>
          <span>
            <strong style={{ color: 'var(--foreground)', fontWeight: 500 }}>↵</strong> open
          </span>
          <span>
            <strong style={{ color: 'var(--foreground)', fontWeight: 500 }}>esc</strong> close
          </span>
        </div>
      </div>
    </div>
  );
};
