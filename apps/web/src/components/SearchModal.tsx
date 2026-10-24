import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyPath } from '../lib/navigation.js';

interface SearchItem {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  country?: string;
}

export const SearchModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([
        { symbol: 'RELIANCE.NS', name: 'Reliance Industries', exchange: 'NSE', currency: 'INR', country: 'India' },
        { symbol: 'RELIANCE.BO', name: 'Reliance Industries', exchange: 'BSE', currency: 'INR', country: 'India' },
        { symbol: 'RPOWER.NS', name: 'Reliance Power', exchange: 'NSE', currency: 'INR', country: 'India' }
      ]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

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

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([
        { symbol: 'RELIANCE.NS', name: 'Reliance Industries', exchange: 'NSE', currency: 'INR', country: 'India' },
        { symbol: 'RELIANCE.BO', name: 'Reliance Industries', exchange: 'BSE', currency: 'INR', country: 'India' },
        { symbol: 'RPOWER.NS', name: 'Reliance Power', exchange: 'NSE', currency: 'INR', country: 'India' }
      ]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/instruments/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setSelectedIndex(0);
        }
      } catch {
        // fallback
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query]);

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
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border)', minHeight: '44px' }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search companies…"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: '15px',
              color: 'var(--foreground)',
              outline: 'none',
              fontWeight: 400,
              minHeight: '44px'
            }}
          />
          <button
            onClick={onClose}
            style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              color: 'var(--text-muted)',
              padding: '0 12px',
              minHeight: '44px',
              height: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--secondary)',
              cursor: 'pointer'
            }}
          >
            ESC
          </button>
        </div>

        {/* Category Header */}
        <div style={{ padding: '12px 20px 6px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
          Companies
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '4px 8px' }}>
          {results.map((item, idx) => {
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
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {item.symbol} · {item.exchange} · {item.currency}
                  </div>
                </div>

                {idx === 0 && (
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
                    Primary listing
                  </span>
                )}
              </div>
            );
          })}
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
