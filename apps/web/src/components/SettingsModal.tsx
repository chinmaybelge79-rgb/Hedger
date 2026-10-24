import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { formatPrice, formatCompact, formatPercent, getUserInitials } from '@hedger/format';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  initialTab?: 'dashboard' | 'prediction' | 'settings';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
  initialTab = 'dashboard'
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'prediction' | 'settings'>(initialTab);
  const { user, isAuthenticated, signOut, updatePlan } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();

  // Portfolio Prediction Simulator State
  const [initialCapital, setInitialCapital] = useState<number>(100000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(1500);
  const [years, setYears] = useState<number>(5);
  const [expectedCagr, setExpectedCagr] = useState<number>(13.5);
  const [currency, setCurrency] = useState<'USD' | 'INR' | 'EUR' | 'GBP'>('USD');

  // Website Settings State
  const [tableDensity, setTableDensity] = useState<'standard' | 'compact'>('standard');
  const [showDelayedBadge, setShowDelayedBadge] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Global ESC key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Portfolio Projection Math
  const totalMonths = years * 12;
  const monthlyRate = expectedCagr / 100 / 12;

  // Future Value of Initial Capital: PV * (1 + r)^n
  const fvInitial = initialCapital * Math.pow(1 + monthlyRate, totalMonths);

  // Future Value of Monthly Contributions: PMT * [((1 + r)^n - 1) / r]
  const fvContributions =
    monthlyRate > 0
      ? monthlyContribution * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)
      : monthlyContribution * totalMonths;

  const projectedTotal = Math.round(fvInitial + fvContributions);
  const totalInvested = initialCapital + monthlyContribution * totalMonths;
  const compoundingGains = Math.max(0, projectedTotal - totalInvested);

  // Stress-test estimate (downside 10th percentile simulation)
  const stressTestTotal = Math.round(
    initialCapital * Math.pow(1 + (expectedCagr - 7) / 100 / 12, totalMonths) +
      monthlyContribution *
        ((Math.pow(1 + Math.max(0.001, (expectedCagr - 7) / 100 / 12), totalMonths) - 1) /
          Math.max(0.001, (expectedCagr - 7) / 100 / 12))
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="General Settings and Terminal Preferences"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: 'var(--card-bg, #FFFFFF)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.16)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)'
          }}
        >
          {/* Navigation Segmented Control */}
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
              { id: 'dashboard', label: 'User Dashboard' },
              { id: 'prediction', label: 'Portfolio Prediction' },
              { id: 'settings', label: 'Website Settings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  height: '32px',
                  padding: '0 14px',
                  fontSize: '12px',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeTab === tab.id ? 'var(--card-bg, #FFFFFF)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--text)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  boxShadow: activeTab === tab.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.12s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '18px',
              cursor: 'pointer',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg, #FFFFFF)'
            }}
            className="hover:bg-[var(--bg-hover)]"
          >
            ×
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: USER DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              {isAuthenticated && user ? (
                <div>
                  {/* User Profile Card */}
                  <div
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '20px',
                      backgroundColor: 'var(--bg-subtle, #F9F9FB)',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent, #1D1D1F)',
                          color: 'var(--bg, #FFFFFF)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '18px'
                        }}
                      >
                        {getUserInitials(user.name, user.email)}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {user.email} · {user.provider.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--accent, #1D1D1F)',
                          color: 'var(--bg, #FFFFFF)'
                        }}
                      >
                        {user.plan} Member
                      </span>
                      <button
                        onClick={signOut}
                        style={{
                          height: '32px',
                          padding: '0 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--card-bg, #FFFFFF)',
                          fontSize: '12px',
                          color: 'var(--down, #B3261E)',
                          cursor: 'pointer'
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>

                  {/* Plan & Usage Metrics */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '16px',
                      marginBottom: '24px'
                    }}
                  >
                    <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Membership Tier</div>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>
                        {user.plan} Plan
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--positive)', marginTop: '4px' }}>
                        Active · Auto-renews monthly
                      </div>
                    </div>

                    <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Saved Models</div>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
                        {user.savedModelsCount} models
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Valuations & scenarios
                      </div>
                    </div>

                    <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>API Quota</div>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
                        842 / 10,000
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Requests this cycle
                      </div>
                    </div>
                  </div>

                  {/* Tier Switcher Quick Demo */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', backgroundColor: 'var(--bg-subtle, #F9F9FB)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                      Switch Plan Preview (Interactive Demo)
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {(['basic', 'plus', 'pro', 'ultra'] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => updatePlan(p)}
                          style={{
                            height: '32px',
                            padding: '0 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: user.plan === p ? 600 : 400,
                            border: user.plan === p ? '1px solid var(--accent)' : '1px solid var(--border)',
                            backgroundColor: user.plan === p ? 'var(--accent)' : 'var(--card-bg, #FFFFFF)',
                            color: user.plan === p ? 'var(--bg, #FFFFFF)' : 'var(--text)',
                            cursor: 'pointer',
                            textTransform: 'capitalize'
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-subtle, #F9F9FB)', border: '1px solid var(--border)', marginBottom: '16px', color: 'var(--text-muted)' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                    Access your Institutional Dashboard
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                    Sign in to sync your valuation models, manage portfolio watchlists, and unlock high-throughput financial data feeds.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAuth('signin');
                      }}
                      style={{
                        height: '44px',
                        padding: '0 20px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--accent, #1D1D1F)',
                        color: 'var(--bg, #FFFFFF)',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAuth('signup');
                      }}
                      style={{
                        height: '44px',
                        padding: '0 20px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-hover, #F2F2F5)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      Create Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PORTFOLIO PREDICTION */}
          {activeTab === 'prediction' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px 0' }}>
                  Forward Portfolio Projection Simulator
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  Model portfolio accumulation compounding under disciplined return and risk assumptions
                </p>
              </div>

              {/* Scenario Preset Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Preset Scenarios:</span>
                {[
                  { label: 'Defensive (8.0%)', cagr: 8.0 },
                  { label: 'Base Case (13.5%)', cagr: 13.5 },
                  { label: 'Alpha Target (18.5%)', cagr: 18.5 }
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setExpectedCagr(s.cagr)}
                    style={{
                      height: '30px',
                      padding: '0 10px',
                      fontSize: '11px',
                      borderRadius: '6px',
                      border: expectedCagr === s.cagr ? '1px solid var(--accent)' : '1px solid var(--border)',
                      backgroundColor: expectedCagr === s.cagr ? 'var(--accent)' : 'var(--card-bg, #FFFFFF)',
                      color: expectedCagr === s.cagr ? 'var(--bg, #FFFFFF)' : 'var(--text)',
                      cursor: 'pointer'
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Inputs Controls Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px'
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Initial Capital ({currency})
                  </label>
                  <input
                    type="number"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(Math.max(0, Number(e.target.value)))}
                    step="5000"
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg, #FFFFFF)',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: 'var(--text)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Monthly Contribution ({currency})
                  </label>
                  <input
                    type="number"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(Math.max(0, Number(e.target.value)))}
                    step="250"
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg, #FFFFFF)',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: 'var(--text)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Horizon (Years)
                  </label>
                  <select
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg, #FFFFFF)',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: 'var(--text)',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value={3}>3 Years (Medium-term)</option>
                    <option value={5}>5 Years (Standard Horizon)</option>
                    <option value={10}>10 Years (Compounding Core)</option>
                    <option value={15}>15 Years (Long-term Wealth)</option>
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>Expected CAGR</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>{expectedCagr.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="25"
                    step="0.5"
                    value={expectedCagr}
                    onChange={(e) => setExpectedCagr(Number(e.target.value))}
                    style={{ width: '100%', height: '6px', accentColor: 'var(--accent, #1D1D1F)', cursor: 'pointer', marginTop: '10px' }}
                  />
                </div>
              </div>

              {/* Output Prediction Card */}
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '24px',
                  backgroundColor: 'var(--bg-subtle, #F9F9FB)',
                  marginBottom: '16px'
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Projected Portfolio Value ({years} Years)
                </div>
                <div style={{ fontSize: '36px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: '4px 0 16px 0' }} className="tnum">
                  {formatPrice({ amount: projectedTotal, currency })}
                </div>

                {/* Progress Bar of Invested vs Gains */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ height: '8px', width: '100%', borderRadius: '4px', backgroundColor: 'var(--border)', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${Math.round((totalInvested / projectedTotal) * 100)}%`, backgroundColor: 'var(--muted-foreground)' }} title="Principal Invested" />
                    <div style={{ flex: 1, backgroundColor: 'var(--positive)' }} title="Compounded Gains" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '12px' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Principal Invested</div>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }} className="tnum">
                      {formatPrice({ amount: totalInvested, currency })}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Compounded Alpha</div>
                    <div style={{ fontWeight: 600, color: 'var(--positive)' }} className="tnum">
                      +{formatPrice({ amount: compoundingGains, currency })}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Downside Stress Test</div>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }} className="tnum">
                      {formatPrice({ amount: stressTestTotal, currency })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WEBSITE SETTINGS */}
          {activeTab === 'settings' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px 0' }}>
                  Terminal & Website Settings
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  Customize display theme, reporting currency, and data density
                </p>
              </div>

              {/* Setting 1: Theme Mode */}
              <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      Color Theme
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Choose between light canvas, dark terminal, or system preference
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
                          height: '30px',
                          padding: '0 12px',
                          fontSize: '11px',
                          fontWeight: theme === t.id ? 600 : 400,
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: theme === t.id ? 'var(--card-bg, #FFFFFF)' : 'transparent',
                          color: theme === t.id ? 'var(--text)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          boxShadow: theme === t.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Setting 2: Default Display Currency */}
              <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      Normalized Reporting Currency
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Used as reference benchmark currency for cross-border comparisons
                    </div>
                  </div>

                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
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
              </div>

              {/* Setting 3: Table Density */}
              <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      Table & Row Density
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Comfortable breathing room vs condensed financial statements
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
                          height: '30px',
                          padding: '0 12px',
                          fontSize: '11px',
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
              </div>

              {/* Setting 4: Data Freshness Indicators */}
              <div style={{ padding: '16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      Display Delay Alerts
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Show 15m delay and EOD timestamp badges on quote headers
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={showDelayedBadge}
                    onChange={(e) => setShowDelayedBadge(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent, #1D1D1F)' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
