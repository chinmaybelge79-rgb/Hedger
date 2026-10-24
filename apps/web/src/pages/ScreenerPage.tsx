import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkline } from '../components/Sparkline.js';
import { companyPath } from '../lib/navigation.js';
import {
  formatPrice,
  formatCompact,
  formatPercent,
  formatMultiple
} from '@hedger/format';

interface ScreenerStock {
  symbol: string;
  name: string;
  country: string;
  region: 'india' | 'us' | 'europe' | 'asia';
  exchange: string;
  sector: string;
  currency: string;
  price: number;
  changePercent: number;
  marketCap: number;
  marketCapUsd: number;
  peRatio: number | null;
  pbRatio: number | null;
  roe: number | null;
  dividendYield: number | null;
  trend: number[];
}

interface FilterOption {
  id: string;
  label: string;
  category: 'market' | 'sector' | 'valuation' | 'profitability' | 'cap' | 'momentum' | 'yield';
  apply: (stock: ScreenerStock) => boolean;
}

const AVAILABLE_FILTERS: FilterOption[] = [
  // Sector
  { id: 'sector-tech', label: 'Sector: Technology', category: 'sector', apply: (s) => s.sector === 'Technology' },
  { id: 'sector-fin', label: 'Sector: Financials', category: 'sector', apply: (s) => s.sector === 'Financial Services' },
  { id: 'sector-health', label: 'Sector: Healthcare', category: 'sector', apply: (s) => s.sector === 'Healthcare' },
  { id: 'sector-energy', label: 'Sector: Energy', category: 'sector', apply: (s) => s.sector === 'Energy' },
  { id: 'sector-auto', label: 'Sector: Automotive', category: 'sector', apply: (s) => s.sector === 'Automotive' },
  { id: 'sector-cons-cycl', label: 'Sector: Consumer Cyclical', category: 'sector', apply: (s) => s.sector === 'Consumer Cyclical' },
  { id: 'sector-cons-def', label: 'Sector: Consumer Defensive', category: 'sector', apply: (s) => s.sector === 'Consumer Defensive' },
  { id: 'sector-ind', label: 'Sector: Industrials', category: 'sector', apply: (s) => s.sector === 'Industrials' },
  { id: 'sector-comm', label: 'Sector: Telecom & Media', category: 'sector', apply: (s) => s.sector === 'Communication Services' },

  // Valuation (P/E)
  { id: 'pe-value', label: 'P/E < 15 (Deep Value)', category: 'valuation', apply: (s) => s.peRatio !== null && s.peRatio < 15 },
  { id: 'pe-25', label: 'P/E < 25 (Reasonable)', category: 'valuation', apply: (s) => s.peRatio !== null && s.peRatio < 25 },
  { id: 'pe-growth', label: 'P/E > 30 (High Growth)', category: 'valuation', apply: (s) => s.peRatio !== null && s.peRatio > 30 },

  // Profitability (ROE)
  { id: 'roe-15', label: 'ROE > 15%', category: 'profitability', apply: (s) => s.roe !== null && s.roe > 0.15 },
  { id: 'roe-20', label: 'ROE > 20% (Elite)', category: 'profitability', apply: (s) => s.roe !== null && s.roe > 0.20 },
  { id: 'roe-30', label: 'ROE > 30% (Capital Light)', category: 'profitability', apply: (s) => s.roe !== null && s.roe > 0.30 },

  // Market Cap (USD normalized)
  { id: 'cap-mega', label: 'Mega Cap (> $200B / ₹15L Cr)', category: 'cap', apply: (s) => s.marketCapUsd > 200000000000 },
  { id: 'cap-large', label: 'Large Cap (> $10B / ₹1L Cr)', category: 'cap', apply: (s) => s.marketCapUsd > 10000000000 },
  { id: 'cap-mid', label: 'Mid Cap ($2B–$10B)', category: 'cap', apply: (s) => s.marketCapUsd >= 2000000000 && s.marketCapUsd <= 10000000000 },

  // Momentum
  { id: 'mom-gainers', label: '1D Gainers (> 0%)', category: 'momentum', apply: (s) => s.changePercent > 0 },
  { id: 'mom-losers', label: '1D Losers (< 0%)', category: 'momentum', apply: (s) => s.changePercent < 0 },
  { id: 'mom-strong', label: 'High Momentum (|1D| > 1.5%)', category: 'momentum', apply: (s) => Math.abs(s.changePercent) > 0.015 },

  // Dividend Yield
  { id: 'div-15', label: 'Dividend Yield > 1.5%', category: 'yield', apply: (s) => s.dividendYield !== null && s.dividendYield > 0.015 },
  { id: 'div-30', label: 'Dividend Yield > 3.0%', category: 'yield', apply: (s) => s.dividendYield !== null && s.dividendYield > 0.030 }
];

export const ScreenerPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [allStocks, setAllStocks] = useState<ScreenerStock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [activeFilterIds, setActiveFilterIds] = useState<string[]>(['roe-15', 'pe-25']);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);
  const [filterMenuCategory, setFilterMenuCategory] = useState<string>('all');

  // Sorting
  const [sortField, setSortField] = useState<'marketCap' | 'price' | 'changePercent' | 'peRatio' | 'roe' | 'name'>('marketCap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Comparison selection
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setIsFilterMenuOpen(false);
      }
    };
    if (isFilterMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isFilterMenuOpen]);

  // Fetch stocks from API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/screener?region=${encodeURIComponent(selectedRegion)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data?.results) {
          setAllStocks(data.results);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedRegion]);

  // Toggle filter
  const toggleFilter = (filterId: string) => {
    setActiveFilterIds((prev) =>
      prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [...prev, filterId]
    );
  };

  const removeFilter = (filterId: string) => {
    setActiveFilterIds((prev) => prev.filter((id) => id !== filterId));
  };

  const resetAllFilters = () => {
    setActiveFilterIds([]);
    setSearchQuery('');
    setSelectedRegion('all');
    setCurrentPage(1);
  };

  // Filter application
  const filteredStocks = useMemo(() => {
    return allStocks.filter((stock) => {
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = stock.name.toLowerCase().includes(q);
        const matchSymbol = stock.symbol.toLowerCase().includes(q);
        const matchSector = stock.sector.toLowerCase().includes(q);
        if (!matchName && !matchSymbol && !matchSector) return false;
      }

      // Active filters
      for (const filterId of activeFilterIds) {
        const option = AVAILABLE_FILTERS.find((f) => f.id === filterId);
        if (option && !option.apply(stock)) {
          return false;
        }
      }

      return true;
    });
  }, [allStocks, activeFilterIds, searchQuery]);

  // Sorting
  const sortedStocks = useMemo(() => {
    return [...filteredStocks].sort((a, b) => {
      let valA: number = 0;
      let valB: number = 0;

      if (sortField === 'marketCap') {
        valA = a.marketCapUsd;
        valB = b.marketCapUsd;
      } else if (sortField === 'price') {
        valA = a.price;
        valB = b.price;
      } else if (sortField === 'changePercent') {
        valA = a.changePercent;
        valB = b.changePercent;
      } else if (sortField === 'peRatio') {
        valA = a.peRatio ?? (sortOrder === 'asc' ? 9999 : -9999);
        valB = b.peRatio ?? (sortOrder === 'asc' ? 9999 : -9999);
      } else if (sortField === 'roe') {
        valA = a.roe ?? -9999;
        valB = b.roe ?? -9999;
      } else if (sortField === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredStocks, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedStocks.length / pageSize));
  const paginatedStocks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedStocks.slice(start, start + pageSize);
  }, [sortedStocks, currentPage, pageSize]);

  // Column header click
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Compare selection
  const toggleSelectForCompare = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    setSelectedForCompare((prev) => {
      if (prev.includes(symbol)) {
        return prev.filter((s) => s !== symbol);
      } else {
        if (prev.length >= 2) {
          return [prev[1], symbol];
        }
        return [...prev, symbol];
      }
    });
  };

  const handleLaunchCompare = () => {
    if (selectedForCompare.length === 2) {
      navigate(`/compare?a=${encodeURIComponent(selectedForCompare[0])}&b=${encodeURIComponent(selectedForCompare[1])}`);
    } else if (selectedForCompare.length === 1) {
      navigate(`/compare?a=${encodeURIComponent(selectedForCompare[0])}`);
    }
  };

  // Market Regions
  const regions = [
    { id: 'all', label: 'All Markets (Global)' },
    { id: 'india', label: 'India · NSE' },
    { id: 'us', label: 'United States · US' },
    { id: 'europe', label: 'Europe' },
    { id: 'asia', label: 'Asia-Pacific' }
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Screener</h1>
          <p className="page-subtitle">
            Filter companies on consistent, documented definitions across global markets
          </p>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
          Real-time · As of 23 Oct 2026 · Global multi-market feed
        </div>
      </div>

      {/* Market Region Segmented Pills */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          marginBottom: '16px'
        }}
      >
        {regions.map((reg) => {
          const isActive = selectedRegion === reg.id;
          return (
            <button
              key={reg.id}
              onClick={() => {
                setSelectedRegion(reg.id);
                setCurrentPage(1);
              }}
              style={{
                height: '36px',
                padding: '0 14px',
                fontSize: '12px',
                fontWeight: isActive ? 600 : 500,
                borderRadius: '8px',
                border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                backgroundColor: isActive ? 'var(--primary)' : 'var(--card)',
                color: isActive ? 'var(--primary-foreground)' : 'var(--foreground)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {reg.label}
            </button>
          );
        })}
      </div>

      {/* Filter Chips Bar */}
      <div
        className="filter-chips-bar"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '20px'
        }}
      >
        {/* Active Market Chip */}
        <span
          className="filter-chip active"
          style={{
            height: '36px',
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0 12px',
            borderRadius: '18px',
            fontSize: '12px'
          }}
        >
          {regions.find((r) => r.id === selectedRegion)?.label || 'All Markets'}
        </span>

        {/* Dynamic Filter Pills */}
        {activeFilterIds.map((filterId) => {
          const opt = AVAILABLE_FILTERS.find((f) => f.id === filterId);
          if (!opt) return null;
          return (
            <span
              key={filterId}
              className="filter-chip"
              style={{
                height: '36px',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 12px',
                borderRadius: '18px',
                backgroundColor: 'var(--secondary)',
                border: '1px solid var(--border)',
                fontSize: '12px',
                color: 'var(--foreground)'
              }}
            >
              <span>{opt.label}</span>
              <button
                onClick={() => removeFilter(filterId)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  lineHeight: 1,
                  marginLeft: '6px',
                  padding: '2px',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
                aria-label={`Remove filter ${opt.label}`}
              >
                ×
              </button>
            </span>
          );
        })}

        {/* Add Filter Button */}
        <div style={{ position: 'relative' }} ref={filterMenuRef}>
          <button
            onClick={() => setIsFilterMenuOpen((prev) => !prev)}
            className="filter-chip"
            style={{
              height: '36px',
              borderStyle: 'dashed',
              color: isFilterMenuOpen ? 'var(--foreground)' : 'var(--text-muted)',
              borderColor: isFilterMenuOpen ? 'var(--foreground)' : 'var(--border)',
              backgroundColor: isFilterMenuOpen ? 'var(--secondary)' : 'var(--card)',
              cursor: 'pointer',
              padding: '0 14px',
              borderRadius: '18px',
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>+ Add filter</span>
            <span style={{ fontSize: '9px', marginLeft: '2px' }}>{isFilterMenuOpen ? '▲' : '▼'}</span>
          </button>

          {/* Add Filter Dropdown Popover */}
          {isFilterMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '44px',
                left: 0,
                zIndex: 100,
                width: '380px',
                backgroundColor: 'var(--card)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
                padding: '16px',
                fontSize: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '13px' }}>Select Filter to Apply</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Click to toggle</span>
              </div>

              {/* Category tabs */}
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                {['all', 'sector', 'valuation', 'profitability', 'cap', 'momentum', 'yield'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterMenuCategory(cat)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: filterMenuCategory === cat ? 'var(--primary)' : 'var(--secondary)',
                      color: filterMenuCategory === cat ? 'var(--primary-foreground)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Filter List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '260px', overflowY: 'auto' }}>
                {AVAILABLE_FILTERS.filter(
                  (f) => filterMenuCategory === 'all' || f.category === filterMenuCategory
                ).map((f) => {
                  const isSelected = activeFilterIds.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => toggleFilter(f.id)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: isSelected ? 'var(--secondary)' : 'var(--card)',
                        color: isSelected ? 'var(--positive)' : 'var(--foreground)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '12px',
                        transition: 'background-color 0.1s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--secondary)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--card)';
                      }}
                    >
                      <span style={{ fontWeight: isSelected ? 600 : 400 }}>{f.label}</span>
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>{isSelected ? '✓ Added' : '+ Add'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Search Input Box */}
        <div style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 'auto' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search company, symbol, or sector..."
            style={{
              height: '36px',
              padding: '0 12px',
              fontSize: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
              outline: 'none',
              width: '260px'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                marginLeft: '-24px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Reset Button */}
        {(activeFilterIds.length > 0 || searchQuery || selectedRegion !== 'all') && (
          <button
            onClick={resetAllFilters}
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              textDecoration: 'underline',
              cursor: 'pointer',
              height: '36px',
              padding: '0 8px',
              display: 'inline-flex',
              alignItems: 'center',
              border: 'none',
              background: 'none'
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Floating Realistic Compare Bar (When rows are checked) */}
      {selectedForCompare.length > 0 && (
        <div
          style={{
            position: 'sticky',
            top: '70px',
            zIndex: 40,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            padding: '12px 20px',
            borderRadius: '10px',
            marginBottom: '16px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
            animation: 'fadeIn 0.2s ease-in'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
            <span style={{ fontWeight: 600 }}>
              {selectedForCompare.length === 1 ? '1 company selected' : '2 companies ready to compare'}:
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {selectedForCompare.map((sym) => (
                <span
                  key={sym}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }}
                >
                  {sym}
                </span>
              ))}
            </div>
            {selectedForCompare.length === 1 && (
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                (Check a 2nd company in the table below)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setSelectedForCompare([])}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '12px',
                textDecoration: 'underline'
              }}
            >
              Clear
            </button>
            <button
              onClick={handleLaunchCompare}
              disabled={selectedForCompare.length === 0}
              style={{
                height: '36px',
                padding: '0 16px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--card)',
                color: 'var(--foreground)',
                cursor: 'pointer'
              }}
            >
              {selectedForCompare.length === 2
                ? `Compare ${selectedForCompare[0]} vs ${selectedForCompare[1]} →`
                : 'Open in Compare →'}
            </button>
          </div>
        </div>
      )}

      {/* Matches Count Subheader */}
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        <strong>{sortedStocks.length} matches</strong> ·{' '}
        <span style={{ color: 'var(--text-muted)' }}>
          {allStocks.length - sortedStocks.length} excluded by active filters
        </span>
      </div>

      {/* Results Table */}
      <div className="table-container" style={{ marginBottom: '24px', overflowX: 'auto' }}>
        <table className="koyfin-table">
          <thead>
            <tr>
              <th style={{ width: '40px', padding: '12px 8px 12px 16px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CMP</span>
              </th>
              <th
                onClick={() => handleSort('name')}
                style={{ padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}
              >
                Company {sortField === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th
                onClick={() => handleSort('price')}
                style={{ padding: '12px 16px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
              >
                Price {sortField === 'price' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th
                onClick={() => handleSort('changePercent')}
                style={{ padding: '12px 16px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
              >
                1D change {sortField === 'changePercent' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th
                onClick={() => handleSort('marketCap')}
                style={{ padding: '12px 16px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
              >
                Market cap {sortField === 'marketCap' ? (sortOrder === 'asc' ? '▲' : '▼') : '▼'}
              </th>
              <th
                onClick={() => handleSort('peRatio')}
                style={{ padding: '12px 16px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
              >
                P/E (TTM) {sortField === 'peRatio' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th
                onClick={() => handleSort('roe')}
                style={{ padding: '12px 16px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
              >
                ROE {sortField === 'roe' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>30D trend</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Streaming global multi-market screener feed...
                </td>
              </tr>
            ) : paginatedStocks.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No companies match the chosen filters.{' '}
                  <button
                    onClick={resetAllFilters}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--foreground)',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Reset filters
                  </button>
                </td>
              </tr>
            ) : (
              paginatedStocks.map((st) => {
                const isSelected = selectedForCompare.includes(st.symbol);
                const isPositive = st.changePercent >= 0;

                return (
                  <tr
                    key={st.symbol}
                    onClick={() => navigate(companyPath(st.symbol))}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(16, 124, 65, 0.04)' : undefined
                    }}
                  >
                    {/* Checkbox for Compare */}
                    <td
                      style={{ padding: '13px 8px 13px 16px', textAlign: 'center' }}
                      onClick={(e) => toggleSelectForCompare(e, st.symbol)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                      />
                    </td>

                    {/* Company */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--foreground)', fontSize: '13px' }}>{st.name}</div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          fontFamily: 'monospace',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '2px'
                        }}
                      >
                        <span>{st.symbol}</span>
                        <span>·</span>
                        <span>{st.exchange}</span>
                        <span>·</span>
                        <span
                          style={{
                            backgroundColor: 'var(--secondary)',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            color: 'var(--text-muted)',
                            fontSize: '10px'
                          }}
                        >
                          {st.sector}
                        </span>
                      </div>
                    </td>

                    {/* Price */}
                    <td
                      style={{ padding: '13px 16px', textAlign: 'right', fontWeight: 500, color: 'var(--foreground)' }}
                      className="tnum"
                    >
                      {formatPrice({ amount: st.price, currency: st.currency })}
                    </td>

                    {/* 1D Change */}
                    <td
                      style={{
                        padding: '13px 16px',
                        textAlign: 'right',
                        fontWeight: 600,
                        color: isPositive ? 'var(--positive)' : 'var(--negative)'
                      }}
                      className="tnum"
                    >
                      {isPositive ? '▲ ' : '▼ '}
                      {formatPercent(st.changePercent)}
                    </td>

                    {/* Market Cap */}
                    <td style={{ padding: '13px 16px', textAlign: 'right', color: 'var(--foreground)' }} className="tnum">
                      {formatCompact({ amount: st.marketCap, currency: st.currency })}
                    </td>

                    {/* P/E (TTM) */}
                    <td style={{ padding: '13px 16px', textAlign: 'right', color: 'var(--foreground)' }} className="tnum">
                      {formatMultiple(st.peRatio)}
                    </td>

                    {/* ROE */}
                    <td style={{ padding: '13px 16px', textAlign: 'right', color: 'var(--foreground)' }} className="tnum">
                      {st.roe !== null ? formatPercent(st.roe) : '—'}
                    </td>

                    {/* 30D Trend Sparkline */}
                    <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                      <Sparkline data={st.trend} isPositive={isPositive} width={64} height={18} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '13px',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <span>
          Showing {sortedStocks.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
          {Math.min(currentPage * pageSize, sortedStocks.length)} of {sortedStocks.length} ·
          Definitions: P/E on diluted TTM EPS; ROE on average equity
        </span>
        <div className="controls-group" style={{ gap: '12px', display: 'flex' }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="btn btn-secondary"
            style={{
              height: '44px',
              minHeight: '44px',
              padding: '0 16px',
              fontSize: '13px',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage <= 1 ? 0.5 : 1
            }}
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="btn btn-secondary"
            style={{
              height: '44px',
              minHeight: '44px',
              padding: '0 16px',
              fontSize: '13px',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage >= totalPages ? 0.5 : 1
            }}
          >
            Next
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '48px' }}>
        Sample screener data for design purposes. Not investment advice.
      </div>
    </div>
  );
};
