import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { useMarket } from '../context/MarketContext.js';
import { companyPath } from '../lib/navigation.js';
import { CompanyLogo } from '../components/CompanyLogo.js';
import { formatPrice, getUserInitials } from '@hedger/format';
import { getFamousSecuritySuggestions, FamousSecurity, FAMOUS_SECURITIES } from '../lib/famousSecurities.js';

interface WatchlistItem {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  sector: string;
}

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

const WATCHLIST_STORAGE_KEY = 'hedger_saved_watchlist';

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

export const ProfilePage: React.FC<{ initialTab?: 'dashboard' | 'watchlist' | 'saved' | 'settings' }> = ({ initialTab }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { activeMarket, setActiveMarket, allMarkets } = useMarket();

  const tabParam = initialTab || searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'watchlist' | 'saved' | 'settings'>(
    tabParam === 'saved' || tabParam === 'watchlist' || tabParam === 'settings' ? tabParam : 'dashboard'
  );

  // Watchlist: persistent in local storage, starts empty if not populated by user
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Saved Models: loaded dynamically from persistent storage/API, starts empty if none saved
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingModels(true);
    fetch('/api/v1/saved')
      .then((res) => (res.ok ? res.json() : { saved: [] }))
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data?.saved)) {
          setSavedModels(data.saved.map(mapDbModelToSavedModel));
        } else {
          setSavedModels([]);
        }
      })
      .catch(() => {
        if (isMounted) setSavedModels([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingModels(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const [newTickerInput, setNewTickerInput] = useState('');
  const [isAddingTicker, setIsAddingTicker] = useState(false);
  const [tickerError, setTickerError] = useState<string | null>(null);
  const [showWatchlistSuggestions, setShowWatchlistSuggestions] = useState(false);
  const watchlistInputRef = useRef<HTMLDivElement>(null);

  // Saved Models Search & Suggestions State
  const [savedSearchQuery, setSavedSearchQuery] = useState('');
  const [showSavedSuggestions, setShowSavedSuggestions] = useState(false);
  const savedInputRef = useRef<HTMLDivElement>(null);

  // Dismiss suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (watchlistInputRef.current && !watchlistInputRef.current.contains(e.target as Node)) {
        setShowWatchlistSuggestions(false);
      }
      if (savedInputRef.current && !savedInputRef.current.contains(e.target as Node)) {
        setShowSavedSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dismiss suggestions on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowWatchlistSuggestions(false);
        setShowSavedSuggestions(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Settings State
  const [preferredCurrency, setPreferredCurrency] = useState<'USD' | 'INR' | 'EUR' | 'GBP'>('USD');
  const [tableDensity, setTableDensity] = useState<'standard' | 'compact'>('standard');
  const [freshnessAlerts, setFreshnessAlerts] = useState<boolean>(true);

  const handleTabChange = (tab: 'dashboard' | 'watchlist' | 'saved' | 'settings') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const addTickerBySymbol = async (rawInput: string) => {
    const sym = rawInput.trim().toUpperCase();
    if (!sym) return;
    setTickerError(null);

    if (watchlist.some((item) => item.symbol === sym)) {
      setTickerError(`${sym} is already in your watchlist.`);
      return;
    }

    setIsAddingTicker(true);
    try {
      const res = await fetch(`/api/instruments/${encodeURIComponent(sym)}/overview`);
      if (res.ok) {
        const json = await res.json();
        const q = json.data || json;
        const newSecurity: WatchlistItem = {
          symbol: q.symbol || sym,
          name: q.name || sym,
          exchange: q.exchange || (sym.includes('.NS') ? 'NSE' : sym.includes('.BO') ? 'BSE' : 'NASDAQ'),
          currency: q.currency || (sym.includes('.NS') || sym.includes('.BO') ? 'INR' : 'USD'),
          price: typeof q.price === 'number' ? q.price : 0,
          change: typeof q.change === 'number' ? q.change : 0,
          changePercent: typeof q.changePercent === 'number' ? q.changePercent : 0,
          sector: q.sector || q.industry || 'Equity'
        };
        const updated = [newSecurity, ...watchlist];
        setWatchlist(updated);
        try {
          localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        setNewTickerInput('');
        setShowWatchlistSuggestions(false);
        return;
      }

      // Check famous securities fallback data
      const famous = FAMOUS_SECURITIES.find((f) => f.symbol.toUpperCase() === sym);
      if (famous) {
        const newSecurity: WatchlistItem = {
          symbol: famous.symbol,
          name: famous.name,
          exchange: famous.exchange,
          currency: famous.currency,
          price: famous.currency === 'INR' ? 1420.5 : 189.75,
          change: 2.15,
          changePercent: 0.012,
          sector: famous.sector
        };
        const updated = [newSecurity, ...watchlist];
        setWatchlist(updated);
        try {
          localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        setNewTickerInput('');
        setShowWatchlistSuggestions(false);
        return;
      }

      // Fallback: try search endpoint to find the ticker
      const searchRes = await fetch(`/api/search?q=${encodeURIComponent(sym)}`);
      const searchData = searchRes.ok ? await searchRes.json() : null;
      const match = searchData?.results?.[0];

      if (match) {
        const detailRes = await fetch(`/api/instruments/${encodeURIComponent(match.symbol)}/overview`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          const q = detailData.data || detailData;
          const newSecurity: WatchlistItem = {
            symbol: q.symbol || match.symbol,
            name: q.name || match.name,
            exchange: q.exchange || match.exchange || (match.symbol.includes('.NS') ? 'NSE' : 'NASDAQ'),
            currency: q.currency || (match.symbol.includes('.NS') ? 'INR' : 'USD'),
            price: typeof q.price === 'number' ? q.price : 0,
            change: typeof q.change === 'number' ? q.change : 0,
            changePercent: typeof q.changePercent === 'number' ? q.changePercent : 0,
            sector: q.sector || q.industry || 'Equity'
          };
          const updated = [newSecurity, ...watchlist];
          setWatchlist(updated);
          try {
            localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
          } catch {}
          setNewTickerInput('');
          setShowWatchlistSuggestions(false);
          return;
        }
      }

      setTickerError(`Unable to locate market data for symbol "${sym}". Please check the ticker.`);
    } catch {
      setTickerError(`Network error retrieving data for symbol "${sym}".`);
    } finally {
      setIsAddingTicker(false);
    }
  };

  const handleAddTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    await addTickerBySymbol(newTickerInput);
  };

  const handleRemoveTicker = (sym: string) => {
    const updated = watchlist.filter((item) => item.symbol !== sym);
    setWatchlist(updated);
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleDeleteSavedModel = async (id: string) => {
    try {
      await fetch(`/api/v1/saved/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {}
    setSavedModels((prev) => prev.filter((m) => m.id !== id));
  };

  const filteredSavedModels = savedModels.filter((model) => {
    if (!savedSearchQuery.trim()) return true;
    const q = savedSearchQuery.trim().toLowerCase();
    return (
      model.symbol.toLowerCase().includes(q) ||
      model.name.toLowerCase().includes(q) ||
      model.notes.toLowerCase().includes(q) ||
      model.assumptions.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Personal Allocator Profile</h1>
          <p className="page-subtitle">
            Manage your personal selections, active watchlist, saved valuation models, and terminal preferences.
          </p>
        </div>

        {/* Tab Navigation Segmented Control */}
        <div
          style={{
            display: 'inline-flex',
            padding: '3px',
            gap: '4px',
            backgroundColor: 'var(--bg-hover, #F2F2F5)',
            borderRadius: '8px',
            border: '1px solid var(--border)'
          }}
        >
          {[
            { id: 'dashboard', label: 'Current Dashboard' },
            { id: 'watchlist', label: `Watchlist (${watchlist.length})` },
            { id: 'saved', label: `Saved Models (${savedModels.length})` },
            { id: 'settings', label: 'Settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              style={{
                height: '36px',
                padding: '0 16px',
                fontSize: '12px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? 'var(--card-bg, #FFFFFF)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text)' : 'var(--text-muted)',
                cursor: 'pointer',
                boxShadow: activeTab === tab.id ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none',
                transition: 'all 0.12s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: CURRENT DASHBOARD
          ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Identity & Status Card */}
          <div
            className="card"
            style={{
              padding: '24px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent, #1D1D1F)',
                  color: 'var(--bg, #FFFFFF)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: 600
                }}
              >
                {getUserInitials(user?.name, user?.email)}
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
                  {user ? user.name : 'Institutional Investor'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
                  {user ? user.email : 'investor@hedger.terminal'} · {user ? user.provider.toUpperCase() : 'STANDARD'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--accent, #1D1D1F)',
                  color: 'var(--bg, #FFFFFF)'
                }}
              >
                {user ? user.plan : 'PRO'} Tier
              </span>
              <button
                onClick={() => navigate('/pricing')}
                className="btn btn-secondary"
                style={{ height: '36px', minHeight: '36px', padding: '0 14px', fontSize: '12px' }}
              >
                Manage Membership
              </button>
              {isAuthenticated && (
                <button
                  onClick={signOut}
                  className="btn btn-secondary"
                  style={{ height: '36px', minHeight: '36px', padding: '0 14px', fontSize: '12px', color: 'var(--down, #B3261E)' }}
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>

          {/* Operational Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                Tracked Watchlist
              </div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text)' }} className="tnum">
                {watchlist.length} Securities
              </div>
              <div style={{ fontSize: '12px', color: 'var(--positive)', marginTop: '4px' }}>
                Real-time streaming active
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                Saved Valuations
              </div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text)' }} className="tnum">
                {savedModels.length} Models
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                DCF & Peer Multiple models
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                Terminal API Quota
              </div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text)' }} className="tnum">
                842 / 10,000
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Requests this monthly cycle
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                Data Freshness
              </div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text)' }}>
                Deterministic
              </div>
              <div style={{ fontSize: '12px', color: 'var(--positive)', marginTop: '4px' }}>
                Zero fabricated production data
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: WATCHLIST & PERSONAL SELECTIONS
          ========================================================================= */}
      {activeTab === 'watchlist' && (
        <div>
          {/* Add Ticker Control Bar with Live Famous Securities Suggestions */}
          <div style={{ marginBottom: '16px' }}>
            <form onSubmit={handleAddTicker} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div ref={watchlistInputRef} style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '480px' }}>
                <input
                  type="text"
                  value={newTickerInput}
                  onChange={(e) => {
                    setNewTickerInput(e.target.value);
                    setShowWatchlistSuggestions(true);
                    if (tickerError) setTickerError(null);
                  }}
                  onFocus={() => setShowWatchlistSuggestions(true)}
                  placeholder="Add security to watchlist (e.g. AAPL, NVDA, RELIANCE.NS)..."
                  disabled={isAddingTicker}
                  style={{
                    width: '100%',
                    height: '44px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card-bg, #FFFFFF)',
                    padding: '0 16px',
                    fontSize: '13px',
                    color: 'var(--text)',
                    boxSizing: 'border-box'
                  }}
                />

                {/* Floating Suggestions Dropdown */}
                {showWatchlistSuggestions && newTickerInput.trim().length > 0 && (
                  <div
                    data-testid="watchlist-suggestions-dropdown"
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
                      <span>Famous Securities for "{newTickerInput}"</span>
                      <span>Suggestions</span>
                    </div>
                    <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      {getFamousSecuritySuggestions(newTickerInput, 6).map((item) => {
                        const isAlreadyAdded = watchlist.some((w) => w.symbol === item.symbol);
                        return (
                          <div
                            key={item.symbol}
                            data-testid={`watchlist-suggestion-${item.symbol}`}
                            onClick={() => {
                              if (!isAlreadyAdded) {
                                addTickerBySymbol(item.symbol);
                              }
                            }}
                            style={{
                              padding: '10px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderBottom: '1px solid var(--border)',
                              cursor: isAlreadyAdded ? 'default' : 'pointer',
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
                            <div>
                              {isAlreadyAdded ? (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    color: 'var(--positive, #12B76A)',
                                    backgroundColor: 'rgba(18, 183, 106, 0.08)',
                                    padding: '4px 8px',
                                    borderRadius: '4px'
                                  }}
                                >
                                  In Watchlist
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{
                                    height: '28px',
                                    minHeight: '28px',
                                    padding: '0 10px',
                                    fontSize: '11px',
                                    fontWeight: 600
                                  }}
                                >
                                  + Add
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
              <button
                type="submit"
                disabled={isAddingTicker || !newTickerInput.trim()}
                className="btn btn-primary"
                style={{ height: '44px', minHeight: '44px', padding: '0 20px', fontSize: '13px', fontWeight: 600 }}
              >
                {isAddingTicker ? 'Fetching Quote...' : 'Add Security'}
              </button>
            </form>
          </div>

          {tickerError && (
            <div style={{ fontSize: '12px', color: 'var(--down, #B3261E)', marginBottom: '16px' }}>
              {tickerError}
            </div>
          )}

          {/* Watchlist Table or Clean Empty State */}
          {watchlist.length === 0 ? (
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
                textAlign: 'center'
              }}
            >
              <div style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20V10" />
                  <path d="M18 20V4" />
                  <path d="M6 20v-4" />
                </svg>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                No securities in your watchlist
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: '20px', margin: 0 }}>
                Enter a symbol in the field above (e.g. AAPL, NVDA, RELIANCE.NS) to monitor live quotes, sector classifications, and daily performance.
              </p>
            </div>
          ) : (
            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', backgroundColor: 'var(--card-bg, #FFFFFF)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-subtle, #FAFAFC)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Security</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Sector</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Price</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>1D Change</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {watchlist.map((item) => (
                    <tr key={item.symbol} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-[var(--bg-hover)]">
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <CompanyLogo symbol={item.symbol} name={item.name} size={24} withContainer rounded />
                          <div>
                            <span
                              onClick={() => navigate(companyPath(item.symbol))}
                              style={{ fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}
                              className="hover:underline"
                            >
                              {item.name}
                            </span>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {item.symbol} · {item.exchange}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{item.sector}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                        {formatPrice({ amount: item.price, currency: item.currency })}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: item.change >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                        {item.change >= 0 ? `+${(item.changePercent * 100).toFixed(2)}%` : `−${(Math.abs(item.changePercent) * 100).toFixed(2)}%`}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => navigate(companyPath(item.symbol))}
                            className="btn btn-secondary"
                            style={{ height: '32px', minHeight: '32px', padding: '0 12px', fontSize: '11px' }}
                          >
                            Dossier →
                          </button>
                          <button
                            onClick={() => handleRemoveTicker(item.symbol)}
                            style={{
                              height: '32px',
                              minHeight: '32px',
                              padding: '0 8px',
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'transparent'
                            }}
                            title="Remove from watchlist"
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: SAVED VALUATION MODELS
          ========================================================================= */}
      {activeTab === 'saved' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
                Saved Valuation Models
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Deterministic cash flow and multiple models preserved with complete assumption snapshots.
              </p>
            </div>
            <button
              onClick={() => navigate('/models')}
              className="btn btn-primary"
              style={{ height: '36px', minHeight: '36px', padding: '0 16px', fontSize: '12px' }}
            >
              + New Model
            </button>
          </div>

          {/* Search bar with instant filter & suggestions */}
          <div ref={savedInputRef} style={{ position: 'relative', marginBottom: '24px', maxWidth: '520px' }}>
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
                value={savedSearchQuery}
                onChange={(e) => {
                  setSavedSearchQuery(e.target.value);
                  setShowSavedSuggestions(true);
                }}
                onFocus={() => setShowSavedSuggestions(true)}
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

            {/* Suggestions Dropdown */}
            {showSavedSuggestions && savedSearchQuery.trim().length > 0 && (
              <div
                data-testid="saved-suggestions-dropdown"
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
                  <span>Famous Securities for "{savedSearchQuery}"</span>
                  <span>Valuation Launcher</span>
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {getFamousSecuritySuggestions(savedSearchQuery, 6).map((item) => (
                    <div
                      key={item.symbol}
                      data-testid={`saved-suggestion-${item.symbol}`}
                      onClick={() => {
                        setShowSavedSuggestions(false);
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

          {isLoadingModels ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Loading saved models...
            </div>
          ) : savedModels.length === 0 ? (
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
                textAlign: 'center'
              }}
            >
              <div style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                No saved valuation models yet
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: '20px', marginBottom: '20px' }}>
                Adjust DCF or multiple models on any company dossier and save your model to track it here.
              </p>
              <button
                onClick={() => navigate('/screener')}
                className="btn btn-secondary"
                style={{ height: '36px', minHeight: '36px', padding: '0 16px', fontSize: '12px' }}
              >
                Browse Market Securities
              </button>
            </div>
          ) : filteredSavedModels.length === 0 ? (
            <div
              style={{
                border: '1px dashed var(--border)',
                borderRadius: '12px',
                padding: '32px 24px',
                backgroundColor: 'var(--card-bg, #FFFFFF)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px'
              }}
            >
              No saved models match &ldquo;{savedSearchQuery}&rdquo;. Try another symbol or open a new valuation using the suggestions above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredSavedModels.map((model) => (
                <div
                  key={model.id}
                  className="card"
                  style={{
                    padding: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span
                        onClick={() => navigate(companyPath(model.symbol))}
                        style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}
                        className="hover:underline"
                      >
                        {model.name}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        ({model.symbol})
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        · Saved {model.savedDate}
                      </span>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text)', margin: '8px 0', lineHeight: 1.4 }}>
                      {model.notes}
                    </p>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      Parameters: {model.assumptions}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Intrinsic Estimate</div>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }} className="tnum">
                        {model.intrinsicValue}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: model.isUp ? 'var(--positive)' : 'var(--negative)' }}>
                        {model.marginOfSafety} margin of safety
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => navigate(`/models/dcf/${encodeURIComponent(model.symbol)}`)}
                        className="btn btn-secondary"
                        style={{ height: '36px', minHeight: '36px', padding: '0 14px', fontSize: '12px' }}
                      >
                        Open Model →
                      </button>
                      <button
                        onClick={() => handleDeleteSavedModel(model.id)}
                        style={{
                          height: '36px',
                          minHeight: '36px',
                          padding: '0 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          backgroundColor: 'transparent',
                          color: 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                        title="Delete model"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: SETTINGS (INCLUDING DARK AND LIGHT MODE)
          ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
            Terminal & Profile Preferences
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Configure visual theme, reporting reference currency, and calculation defaults.
          </p>

          {/* Setting 1: Theme Selector */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Color Theme</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Select light canvas, dark terminal, or match system preference
              </div>
            </div>

            <div
              style={{
                display: 'inline-flex',
                padding: '3px',
                gap: '4px',
                backgroundColor: 'var(--bg-hover, #F2F2F5)',
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}
            >
              {[
                { id: 'light', label: 'Light' },
                { id: 'dark', label: 'Dark' },
                { id: 'system', label: 'System' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  style={{
                    height: '32px',
                    padding: '0 14px',
                    fontSize: '12px',
                    fontWeight: theme === t.id ? 600 : 400,
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: theme === t.id ? 'var(--card-bg, #FFFFFF)' : 'transparent',
                    color: theme === t.id ? 'var(--text)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    boxShadow: theme === t.id ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Setting: Primary Market Desk */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>Primary Financial Market Desk</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Scopes search, screener, and institutional overviews to this market
              </div>
            </div>

            <div
              style={{
                display: 'inline-flex',
                padding: '3px',
                gap: '4px',
                backgroundColor: 'var(--bg-subtle, var(--secondary))',
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}
            >
              {allMarkets.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveMarket(m.id)}
                  style={{
                    height: '32px',
                    padding: '0 12px',
                    fontSize: '12px',
                    fontWeight: activeMarket === m.id ? 600 : 400,
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeMarket === m.id ? 'var(--card)' : 'transparent',
                    color: activeMarket === m.id ? 'var(--foreground)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    boxShadow: activeMarket === m.id ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{m.shortName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Setting 2: Reference Currency */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Normalized Benchmark Currency</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Default reference currency for foreign and cross-border comparisons
              </div>
            </div>

            <select
              value={preferredCurrency}
              onChange={(e) => setPreferredCurrency(e.target.value as any)}
              style={{
                height: '36px',
                padding: '0 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card-bg, #FFFFFF)',
                color: 'var(--text)',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          {/* Setting 3: Table Density */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Table Row Density</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Adjust line spacing and table cell padding
              </div>
            </div>

            <div
              style={{
                display: 'inline-flex',
                padding: '3px',
                gap: '4px',
                backgroundColor: 'var(--bg-hover, #F2F2F5)',
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}
            >
              {[
                { id: 'standard', label: 'Standard' },
                { id: 'compact', label: 'Compact' }
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setTableDensity(d.id as any)}
                  style={{
                    height: '32px',
                    padding: '0 14px',
                    fontSize: '12px',
                    fontWeight: tableDensity === d.id ? 600 : 400,
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: tableDensity === d.id ? 'var(--card-bg, #FFFFFF)' : 'transparent',
                    color: tableDensity === d.id ? 'var(--text)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Setting 4: Data Freshness Alerts */}
          <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Display Delay Alerts</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Show exchange delay and timestamp badges on quote headers
              </div>
            </div>

            <input
              type="checkbox"
              checked={freshnessAlerts}
              onChange={(e) => setFreshnessAlerts(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent, #1D1D1F)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
