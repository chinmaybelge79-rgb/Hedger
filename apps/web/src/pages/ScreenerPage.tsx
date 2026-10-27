import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkline } from '../components/Sparkline.js';
import { companyPath } from '../lib/navigation.js';
import { CompanyLogo } from '../components/CompanyLogo.js';
import { useMarket } from '../context/MarketContext.js';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeMarket, setActiveMarket, marketConfig, isInstrumentInActiveMarket } = useMarket();

  // Helper to map global activeMarket to screener region identifier
  const regionFromMarket = (m: string) => {
    if (m === 'in') return 'india';
    if (m === 'eu') return 'europe';
    if (m === 'asia') return 'asia';
    if (m === 'all') return 'all';
    return 'us';
  };

  const initialRegion = searchParams.get('region') || regionFromMarket(activeMarket);

  // State
  const [allStocks, setAllStocks] = useState<ScreenerStock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRegion, setSelectedRegion] = useState<string>(initialRegion);
  const [activeFilterIds, setActiveFilterIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);
  const [filterMenuCategory, setFilterMenuCategory] = useState<string>('all');

  // Sorting
  const [sortField, setSortField] = useState<'marketCap' | 'price' | 'changePercent' | 'peRatio' | 'roe' | 'name'>('marketCap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Comparison selection & strict same-currency constraint
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [compareCurrencyNotice, setCompareCurrencyNotice] = useState<string | null>(null);
  const [isCompareMenuOpen, setIsCompareMenuOpen] = useState<boolean>(false);
  const [manualCompareQuery, setManualCompareQuery] = useState<string>('');
  const [remoteSearchResults, setRemoteSearchResults] = useState<Array<{ symbol: string; name: string; currency: string; exchange: string; price?: number }>>([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState<boolean>(false);
  const compareMenuRef = useRef<HTMLDivElement>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Helper to determine the currency of a stock symbol
  const getStockCurrency = (symbol: string): string => {
    const s = allStocks.find((item) => item.symbol.toUpperCase() === symbol.toUpperCase());
    if (s?.currency) return s.currency;
    const remote = remoteSearchResults.find((item) => item.symbol.toUpperCase() === symbol.toUpperCase());
    if (remote?.currency) return remote.currency;
    const sym = symbol.toUpperCase();
    if (sym.endsWith('.NS') || sym.endsWith('.BO')) return 'INR';
    if (sym.endsWith('.L')) return 'GBP';
    if (sym.endsWith('.DE') || sym.endsWith('.PA') || sym.endsWith('.AS') || sym.endsWith('.MC') || sym.endsWith('.MI')) return 'EUR';
    if (sym.endsWith('.T')) return 'JPY';
    if (sym.endsWith('.HK')) return 'HKD';
    return 'USD';
  };

  // Base comparison currency determined by the first selected stock
  const compareBaseCurrency = useMemo(() => {
    if (selectedForCompare.length === 0) return null;
    return getStockCurrency(selectedForCompare[0]);
  }, [selectedForCompare, allStocks, remoteSearchResults]);

  // Synchronize when global activeMarket changes
  useEffect(() => {
    const targetReg = regionFromMarket(activeMarket);
    if (targetReg !== selectedRegion) {
      setSelectedRegion(targetReg);
      setCurrentPage(1);
    }
  }, [activeMarket]);

  // Synchronize URL query param if present
  useEffect(() => {
    const regParam = searchParams.get('region');
    if (regParam) {
      const norm = regParam.toLowerCase();
      const mapped = norm === 'in' ? 'india' : norm === 'eu' ? 'europe' : norm;
      if (mapped !== selectedRegion) {
        setSelectedRegion(mapped);
      }
      if (mapped === 'india' && activeMarket !== 'in') setActiveMarket('in');
      else if (mapped === 'us' && activeMarket !== 'us') setActiveMarket('us');
      else if (mapped === 'europe' && activeMarket !== 'eu') setActiveMarket('eu');
      else if (mapped === 'asia' && activeMarket !== 'asia') setActiveMarket('asia');
      else if (mapped === 'all' && activeMarket !== 'all') setActiveMarket('all');
    }
  }, [searchParams, selectedRegion, activeMarket, setActiveMarket]);

  // Remote instruments search for manual compare picker
  useEffect(() => {
    const q = manualCompareQuery.trim();
    if (q.length < 2) {
      setRemoteSearchResults([]);
      return;
    }
    let isCancelled = false;
    setIsSearchingRemote(true);
    const timer = setTimeout(() => {
      fetch(`/api/instruments/search?q=${encodeURIComponent(q)}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((items) => {
          if (isCancelled) return;
          if (Array.isArray(items)) {
            setRemoteSearchResults(
              items.map((it: any) => ({
                symbol: it.symbol,
                name: it.name || it.symbol,
                currency: it.currency || (it.symbol.endsWith('.NS') ? 'INR' : 'USD'),
                exchange: it.exchange || '',
                price: it.price
              }))
            );
          }
          setIsSearchingRemote(false);
        })
        .catch(() => {
          if (!isCancelled) setIsSearchingRemote(false);
        });
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [manualCompareQuery]);

  // Combined manual compare search results
  const combinedCompareSearchResults = useMemo(() => {
    const q = manualCompareQuery.trim().toLowerCase();
    const map = new Map<string, { symbol: string; name: string; currency: string; exchange: string; price?: number }>();

    for (const s of allStocks) {
      if (
        !q ||
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q)
      ) {
        map.set(s.symbol, {
          symbol: s.symbol,
          name: s.name,
          currency: s.currency,
          exchange: s.exchange,
          price: s.price
        });
      }
    }

    for (const r of remoteSearchResults) {
      if (!map.has(r.symbol)) {
        map.set(r.symbol, r);
      }
    }

    const list = Array.from(map.values());

    if (compareBaseCurrency) {
      return list.sort((a, b) => {
        const aMatch = a.currency === compareBaseCurrency ? 0 : 1;
        const bMatch = b.currency === compareBaseCurrency ? 0 : 1;
        return aMatch - bMatch;
      }).slice(0, 15);
    }

    return list.slice(0, 15);
  }, [allStocks, remoteSearchResults, manualCompareQuery, compareBaseCurrency]);

  // Close filter menu and manual compare menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setIsFilterMenuOpen(false);
      }
      if (compareMenuRef.current && !compareMenuRef.current.contains(e.target as Node)) {
        setIsCompareMenuOpen(false);
      }
    };
    if (isFilterMenuOpen || isCompareMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isFilterMenuOpen, isCompareMenuOpen]);

  // Fetch stocks from API scoped strictly to selected region
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
    setCurrentPage(1);
  };

  // Filter application: Strictly guarantees no other country stocks leak through
  const filteredStocks = useMemo(() => {
    return allStocks.filter((stock) => {
      // 1. Strict Active Market Scoping: ensure no other country stocks leak through
      if (!isInstrumentInActiveMarket(stock)) {
        return false;
      }

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
  }, [allStocks, activeFilterIds, searchQuery, isInstrumentInActiveMarket]);

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

  // Compare selection & same-currency enforcement
  const handleRemoveCompareSymbol = (sym: string) => {
    setSelectedForCompare((prev) => prev.filter((s) => s !== sym));
    setCompareCurrencyNotice(null);
  };

  const handleManualAddCompare = (symbol: string) => {
    setCompareCurrencyNotice(null);
    const targetCurr = getStockCurrency(symbol);

    if (selectedForCompare.length === 0) {
      setSelectedForCompare([symbol]);
      return;
    }

    if (selectedForCompare.includes(symbol)) {
      setSelectedForCompare((prev) => prev.filter((s) => s !== symbol));
      return;
    }

    const baseCurr = getStockCurrency(selectedForCompare[0]);
    if (baseCurr !== targetCurr) {
      setCompareCurrencyNotice(
        `Comparison restricted: Companies can only be compared to same currency companies only (${baseCurr}). ${symbol} is denominated in ${targetCurr}.`
      );
      return;
    }

    setSelectedForCompare([selectedForCompare[0], symbol]);
    setIsCompareMenuOpen(false);
  };

  const toggleSelectForCompare = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    setCompareCurrencyNotice(null);

    setSelectedForCompare((prev) => {
      if (prev.includes(symbol)) {
        return prev.filter((s) => s !== symbol);
      }

      if (prev.length === 0) {
        return [symbol];
      }

      const baseCurr = getStockCurrency(prev[0]);
      const targetCurr = getStockCurrency(symbol);

      if (baseCurr !== targetCurr) {
        setCompareCurrencyNotice(
          `Comparison restricted: Companies can only be compared to same currency companies only (${baseCurr}). ${symbol} is denominated in ${targetCurr}.`
        );
        return prev;
      }

      if (prev.length >= 2) {
        return [prev[0], symbol];
      }

      return [prev[0], symbol];
    });
  };

  const handleLaunchCompare = () => {
    if (selectedForCompare.length === 2) {
      const currA = getStockCurrency(selectedForCompare[0]);
      const currB = getStockCurrency(selectedForCompare[1]);
      if (currA !== currB) {
        setCompareCurrencyNotice(
          `Comparison restricted: Companies can only be compared to same currency companies only (${currA} vs ${currB}).`
        );
        return;
      }
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
                if (reg.id === 'india') setActiveMarket('in');
                else if (reg.id === 'us') setActiveMarket('us');
                else if (reg.id === 'europe') setActiveMarket('eu');
                else if (reg.id === 'asia') setActiveMarket('asia');
                else if (reg.id === 'all') setActiveMarket('all');
                setSearchParams({ region: reg.id }, { replace: true });
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
          data-testid="screener-active-market-chip"
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
          <span>{regions.find((r) => r.id === selectedRegion)?.label || marketConfig.shortName}</span>
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
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>{isSelected ? 'Added' : '+ Add'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Manual Compare Search Trigger & Popover */}
        <div style={{ position: 'relative' }} ref={compareMenuRef}>
          <button
            type="button"
            data-testid="screener-manual-compare-btn"
            onClick={() => setIsCompareMenuOpen((prev) => !prev)}
            className="filter-chip"
            style={{
              height: '36px',
              borderStyle: selectedForCompare.length > 0 ? 'solid' : 'dashed',
              color: isCompareMenuOpen || selectedForCompare.length > 0 ? 'var(--foreground)' : 'var(--text-muted)',
              borderColor: isCompareMenuOpen || selectedForCompare.length > 0 ? 'var(--foreground)' : 'var(--border)',
              backgroundColor: isCompareMenuOpen ? 'var(--secondary)' : 'var(--card)',
              cursor: 'pointer',
              padding: '0 14px',
              borderRadius: '18px',
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>+ Add to Compare</span>
            {selectedForCompare.length > 0 && (
              <span
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 600,
                  marginLeft: '4px'
                }}
              >
                {selectedForCompare.length}
              </span>
            )}
            <span style={{ fontSize: '10px', marginLeft: '2px' }}>{isCompareMenuOpen ? '▲' : '▼'}</span>
          </button>

          {/* Manual Compare Search Dropdown Popover */}
          {isCompareMenuOpen && (
            <div
              data-testid="screener-manual-compare-popover"
              style={{
                position: 'absolute',
                top: '44px',
                left: 0,
                zIndex: 110,
                width: '420px',
                backgroundColor: 'var(--card)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.16)',
                padding: '16px',
                fontSize: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '13px' }}>
                  Search Company to Compare
                </span>
                <button
                  type="button"
                  onClick={() => setIsCompareMenuOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '2px 4px'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Currency Scope Notice */}
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  marginBottom: '12px',
                  lineHeight: '1.4'
                }}
              >
                {compareBaseCurrency ? (
                  <span>
                    Active comparison currency:{' '}
                    <strong style={{ color: 'var(--foreground)' }}>{compareBaseCurrency}</strong>. Only companies denominated in {compareBaseCurrency} can be compared.
                  </span>
                ) : (
                  <span>Search any company. Selecting a company locks comparison to that company&apos;s currency.</span>
                )}
              </div>

              {/* Search Input */}
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <input
                  type="text"
                  data-testid="manual-compare-search-input"
                  value={manualCompareQuery}
                  onChange={(e) => setManualCompareQuery(e.target.value)}
                  placeholder={compareBaseCurrency ? `Search ${compareBaseCurrency} symbol or company name...` : "Search symbol or company name..."}
                  autoFocus
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 12px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {manualCompareQuery && (
                  <button
                    type="button"
                    onClick={() => setManualCompareQuery('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '8px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Selected List Chips inside Popover */}
              {selectedForCompare.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap',
                    marginBottom: '12px',
                    padding: '8px',
                    backgroundColor: 'var(--secondary)',
                    borderRadius: '6px'
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Selected:</span>
                  {selectedForCompare.map((sym) => (
                    <span
                      key={sym}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontFamily: 'monospace'
                      }}
                    >
                      <CompanyLogo symbol={sym} size={14} rounded />
                      <span>{sym}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCompareSymbol(sym)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: '12px',
                          lineHeight: 1
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {selectedForCompare.length === 2 && (
                    <button
                      type="button"
                      onClick={handleLaunchCompare}
                      style={{
                        marginLeft: 'auto',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Compare →
                    </button>
                  )}
                </div>
              )}

              {/* Candidate List */}
              <div
                data-testid="manual-compare-results-list"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}
              >
                {isSearchingRemote && (
                  <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                    Searching global instruments...
                  </div>
                )}
                {!isSearchingRemote && combinedCompareSearchResults.length === 0 && (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                    No companies found matching &quot;{manualCompareQuery}&quot;
                  </div>
                )}
                {combinedCompareSearchResults.map((item) => {
                  const isAlreadySelected = selectedForCompare.includes(item.symbol);
                  const isCurrencyMismatch = !!compareBaseCurrency && item.currency !== compareBaseCurrency;

                  return (
                    <div
                      key={item.symbol}
                      data-testid={`manual-compare-row-${item.symbol}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        backgroundColor: isAlreadySelected ? 'var(--secondary)' : 'var(--card)',
                        border: '1px solid var(--border)',
                        opacity: isCurrencyMismatch ? 0.6 : 1,
                        transition: 'background-color 0.1s ease'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, paddingRight: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '12px' }}>
                            {item.symbol}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '2px 4px',
                              borderRadius: '3px',
                              backgroundColor: isCurrencyMismatch ? 'rgba(234, 88, 12, 0.15)' : 'var(--secondary)',
                              color: isCurrencyMismatch ? '#ea580c' : 'var(--text-muted)',
                              fontWeight: 600
                            }}
                          >
                            {item.currency}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '240px'
                          }}
                        >
                          {item.name}
                        </span>
                      </div>

                      <div>
                        {isAlreadySelected ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveCompareSymbol(item.symbol)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              borderRadius: '4px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'transparent',
                              color: 'var(--text-muted)',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        ) : isCurrencyMismatch ? (
                          <button
                            type="button"
                            onClick={() => handleManualAddCompare(item.symbol)}
                            title={`Cannot compare ${item.currency} with ${compareBaseCurrency}`}
                            style={{
                              padding: '4px 8px',
                              fontSize: '10px',
                              borderRadius: '4px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--secondary)',
                              color: 'var(--text-muted)',
                              cursor: 'not-allowed',
                              fontWeight: 500
                            }}
                          >
                            {item.currency} != {compareBaseCurrency}
                          </button>
                        ) : (
                          <button
                            type="button"
                            data-testid={`add-compare-item-${item.symbol}`}
                            onClick={() => handleManualAddCompare(item.symbol)}
                            style={{
                              padding: '4px 10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '4px',
                              border: 'none',
                              backgroundColor: 'var(--primary)',
                              color: 'var(--primary-foreground)',
                              cursor: 'pointer'
                            }}
                          >
                            + Compare
                          </button>
                        )}
                      </div>
                    </div>
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

      {/* Floating Realistic Compare Bar (When rows are checked or added) */}
      {selectedForCompare.length > 0 && (
        <div
          data-testid="screener-floating-compare-bar"
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600 }}>
              {selectedForCompare.length === 1 ? '1 company selected' : '2 companies ready to compare'}:
            </span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {selectedForCompare.map((sym) => (
                <span
                  key={sym}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{sym}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCompareSymbol(sym)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-foreground)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: 0,
                      lineHeight: 1,
                      opacity: 0.8
                    }}
                    title={`Remove ${sym}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Currency Scope Indicator */}
            {compareBaseCurrency && (
              <span
                data-testid="screener-compare-currency-badge"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                Same Currency: {compareBaseCurrency}
              </span>
            )}

            {selectedForCompare.length === 1 && (
              <button
                type="button"
                data-testid="search-second-company-btn"
                onClick={() => {
                  setIsCompareMenuOpen(true);
                  if (compareMenuRef.current) {
                    compareMenuRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px dashed rgba(255, 255, 255, 0.4)',
                  color: 'var(--primary-foreground)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                + Search 2nd {compareBaseCurrency} company
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => {
                setSelectedForCompare([]);
                setCompareCurrencyNotice(null);
              }}
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
              data-testid="launch-compare-btn"
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

      {/* Currency Restriction Notice Banner */}
      {compareCurrencyNotice && (
        <div
          data-testid="compare-currency-notice"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(234, 88, 12, 0.1)',
            border: '1px solid rgba(234, 88, 12, 0.3)',
            color: 'var(--foreground)',
            fontSize: '12px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: '#ea580c' }}>Currency Restriction:</span>
            <span>{compareCurrencyNotice}</span>
          </div>
          <button
            type="button"
            data-testid="dismiss-compare-currency-notice"
            onClick={() => setCompareCurrencyNotice(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '2px 4px'
            }}
          >
            ×
          </button>
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
                const isCurrencyMismatch = Boolean(
                  selectedForCompare.length === 1 &&
                  compareBaseCurrency &&
                  st.currency !== compareBaseCurrency
                );

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
                      data-testid={`screener-row-compare-cell-${st.symbol}`}
                      style={{
                        padding: '13px 8px 13px 16px',
                        textAlign: 'center',
                        cursor: isCurrencyMismatch ? 'not-allowed' : 'pointer'
                      }}
                      onClick={(e) => toggleSelectForCompare(e, st.symbol)}
                      title={
                        isCurrencyMismatch
                          ? `Cannot compare ${st.currency} with ${compareBaseCurrency}. Companies can only be compared to same currency companies.`
                          : isSelected
                          ? 'Click to remove from compare'
                          : 'Click to add to compare'
                      }
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isCurrencyMismatch}
                        onChange={() => {}}
                        data-testid={`screener-row-compare-checkbox-${st.symbol}`}
                        style={{
                          cursor: isCurrencyMismatch ? 'not-allowed' : 'pointer',
                          width: '15px',
                          height: '15px',
                          opacity: isCurrencyMismatch ? 0.3 : 1,
                          pointerEvents: isCurrencyMismatch ? 'none' : 'auto'
                        }}
                      />
                    </td>

                    {/* Company */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CompanyLogo symbol={st.symbol} name={st.name} size={24} withContainer rounded />
                        <div>
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
                        </div>
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
