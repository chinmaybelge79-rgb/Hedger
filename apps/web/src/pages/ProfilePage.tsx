import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { companyPath } from '../lib/navigation.js';
import { formatPrice, getUserInitials } from '@hedger/format';

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

export const ProfilePage: React.FC<{ initialTab?: 'dashboard' | 'watchlist' | 'saved' | 'settings' }> = ({ initialTab }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, signOut, updatePlan } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const tabParam = initialTab || searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'watchlist' | 'saved' | 'settings'>(
    tabParam === 'saved' || tabParam === 'watchlist' || tabParam === 'settings' ? tabParam : 'dashboard'
  );

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries', exchange: 'NSE', currency: 'INR', price: 1173.0, change: 10.15, changePercent: 0.0087, sector: 'Energy & Retail' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE', currency: 'INR', price: 2535.5, change: -11.45, changePercent: -0.0045, sector: 'IT Services' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', exchange: 'NSE', currency: 'INR', price: 1742.0, change: 14.8, changePercent: 0.0086, sector: 'Banking' },
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', currency: 'USD', price: 348.22, change: 4.88, changePercent: 0.0142, sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', currency: 'USD', price: 521.08, change: 6.1, changePercent: 0.0118, sector: 'Cloud & Software' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', currency: 'USD', price: 210.96, change: -1.25, changePercent: -0.0059, sector: 'Semiconductors' }
  ]);

  const [savedModels, setSavedModels] = useState<SavedModel[]>([
    {
      id: '1',
      name: 'Reliance Industries',
      symbol: 'RELIANCE.NS',
      savedDate: '12 Oct 2026',
      priceAtSave: '₹1,173.00',
      intrinsicValue: '₹1,380.00',
      marginOfSafety: '+17.6%',
      isUp: true,
      notes: 'Retail and digital margins expand; energy cash flow remains resilient.',
      assumptions: 'WACC 10.5% · g 4.0% · EBIT margin 18.0% · 5Y growth 10.0%'
    },
    {
      id: '2',
      name: 'Tata Consultancy Services',
      symbol: 'TCS.NS',
      savedDate: '2 Oct 2026',
      priceAtSave: '₹2,535.50',
      intrinsicValue: '₹2,890.00',
      marginOfSafety: '+14.0%',
      isUp: true,
      notes: 'High ROE quality compounder with strong operating cash flow.',
      assumptions: 'WACC 11.0% · g 4.0% · EBIT margin 24.0% · 5Y growth 9.0%'
    },
    {
      id: '3',
      name: 'Apple Inc.',
      symbol: 'AAPL',
      savedDate: '25 Sep 2026',
      priceAtSave: '$348.22',
      intrinsicValue: '$395.00',
      marginOfSafety: '+13.4%',
      isUp: true,
      notes: 'Services mix lifts margins; stable enterprise cash flows.',
      assumptions: 'WACC 8.5% · g 3.5% · EBIT margin 31.0% · 5Y growth 8.0%'
    }
  ]);

  const [newTickerInput, setNewTickerInput] = useState('');

  // Settings State
  const [preferredCurrency, setPreferredCurrency] = useState<'USD' | 'INR' | 'EUR' | 'GBP'>('USD');
  const [tableDensity, setTableDensity] = useState<'standard' | 'compact'>('standard');
  const [freshnessAlerts, setFreshnessAlerts] = useState<boolean>(true);

  const handleTabChange = (tab: 'dashboard' | 'watchlist' | 'saved' | 'settings') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTickerInput.trim()) return;
    const ticker = newTickerInput.trim().toUpperCase();
    if (watchlist.some((item) => item.symbol === ticker)) {
      setNewTickerInput('');
      return;
    }
    setWatchlist([
      ...watchlist,
      {
        symbol: ticker,
        name: ticker,
        exchange: ticker.includes('.NS') ? 'NSE' : 'NYSE',
        currency: ticker.includes('.NS') ? 'INR' : 'USD',
        price: 150.0,
        change: 1.5,
        changePercent: 0.01,
        sector: 'Equity Security'
      }
    ]);
    setNewTickerInput('');
  };

  const handleRemoveTicker = (sym: string) => {
    setWatchlist(watchlist.filter((item) => item.symbol !== sym));
  };

  const handleDeleteSavedModel = (id: string) => {
    setSavedModels(savedModels.filter((m) => m.id !== id));
  };

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
          {/* Add Ticker Control Bar */}
          <form onSubmit={handleAddTicker} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input
              type="text"
              value={newTickerInput}
              onChange={(e) => setNewTickerInput(e.target.value)}
              placeholder="Add security to watchlist (e.g. INFY.NS, GOOGL, SHEL.L)..."
              style={{
                flex: 1,
                maxWidth: '480px',
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
            <button
              type="submit"
              className="btn btn-primary"
              style={{ height: '44px', minHeight: '44px', padding: '0 20px', fontSize: '13px', fontWeight: 600 }}
            >
              Add Security
            </button>
          </form>

          {/* Watchlist Table */}
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
        </div>
      )}

      {/* =========================================================================
          TAB 3: SAVED VALUATION MODELS (RELOCATED FROM NAVBAR)
          ========================================================================= */}
      {activeTab === 'saved' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {savedModels.map((model) => (
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
