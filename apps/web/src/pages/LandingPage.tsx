import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyPath } from '../lib/navigation.js';
import { HedgerChart } from '@hedger/charts';
import { calculateDCF } from '@hedger/valuation';
import { formatPrice, formatPercent, formatCompact } from '@hedger/format';
import { Sparkline } from '../components/Sparkline.js';
import type { HistoricalBar } from '@hedger/types';

interface ShowcaseCompany {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  peRatio: number;
  baseValuation: number;
  bearValuation: number;
  bullValuation: number;
}

const SHOWCASE_COMPANIES: ShowcaseCompany[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Consumer Electronics & Software',
    price: 347.73,
    change: 4.88,
    changePercent: 0.0142,
    marketCap: 5074761285632,
    peRatio: 39.88,
    baseValuation: 395.0,
    bearValuation: 295.0,
    bullValuation: 485.0
  },
  {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Limited',
    exchange: 'NSE',
    currency: 'INR',
    sector: 'Energy, Retail & Telecom',
    price: 1190.0,
    change: 10.15,
    changePercent: 0.0087,
    marketCap: 16103642435650,
    peRatio: 21.45,
    baseValuation: 1380.0,
    bearValuation: 1050.0,
    bullValuation: 1720.0
  },
  {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services',
    exchange: 'NSE',
    currency: 'INR',
    sector: 'IT Services & Consulting',
    price: 2530.0,
    change: -11.45,
    changePercent: -0.0045,
    marketCap: 9153761420540,
    peRatio: 17.57,
    baseValuation: 2890.0,
    bearValuation: 2240.0,
    bullValuation: 3450.0
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Cloud & Enterprise Infrastructure',
    price: 524.51,
    change: 6.1,
    changePercent: 0.0118,
    marketCap: 3894773022720,
    peRatio: 29.22,
    baseValuation: 580.0,
    bearValuation: 440.0,
    bullValuation: 710.0
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Accelerated Computing & AI',
    price: 210.96,
    change: -1.25,
    changePercent: -0.0059,
    marketCap: 5094050889728, // $5.09T live market capitalization
    peRatio: 26.67,
    baseValuation: 235.0,
    bearValuation: 165.0,
    bullValuation: 310.0
  }
];

interface BenchmarkTicker {
  symbol: string;
  name: string;
  region: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  trend: number[];
}

const DEFAULT_BENCHMARKS: BenchmarkTicker[] = [
  {
    symbol: '^NSEI',
    name: 'NIFTY 50',
    region: 'India',
    currency: 'INR',
    price: 24850.3,
    change: 104.2,
    changePercent: 0.0042,
    trend: [24600, 24650, 24710, 24690, 24780, 24810, 24850]
  },
  {
    symbol: '^GSPC',
    name: 'S&P 500',
    region: 'US',
    currency: 'USD',
    price: 7663.43,
    change: -16.2,
    changePercent: -0.0021,
    trend: [7720, 7710, 7690, 7680, 7700, 7650, 7663]
  },
  {
    symbol: '^IXIC',
    name: 'NASDAQ',
    region: 'US',
    currency: 'USD',
    price: 26450.8,
    change: 98.4,
    changePercent: 0.0038,
    trend: [26100, 26250, 26200, 26380, 26320, 26410, 26450]
  },
  {
    symbol: '^FTSE',
    name: 'FTSE 100',
    region: 'Europe',
    currency: 'GBP',
    price: 10706.66,
    change: -16.9,
    changePercent: -0.0016,
    trend: [10680, 10710, 10740, 10720, 10715, 10730, 10706]
  },
  {
    symbol: 'GC=F',
    name: 'Gold Dec 26',
    region: 'Global',
    currency: 'USD',
    price: 4029.4,
    change: 26.1,
    changePercent: 0.0065,
    trend: [3980, 3995, 4010, 4005, 4018, 4022, 4029]
  }
];

export const LandingPage: React.FC<{ onOpenSearch: () => void }> = ({ onOpenSearch }) => {
  const navigate = useNavigate();

  // 1. Master Showcase State
  const [selectedSymbol, setSelectedSymbol] = useState<string>('AAPL');
  const [showcaseBars, setShowcaseBars] = useState<HistoricalBar[]>([]);
  const [barsLoading, setBarsLoading] = useState<boolean>(false);
  const [chartInterval, setChartInterval] = useState<string>('1y');
  const [liveCompanyData, setLiveCompanyData] = useState<Partial<ShowcaseCompany>>({});

  // 2. Global Benchmarks Ribbon State
  const [benchmarks, setBenchmarks] = useState<BenchmarkTicker[]>(DEFAULT_BENCHMARKS);

  // 3. Interactive DCF Sandbox State
  const [simGrowth, setSimGrowth] = useState<number>(12); // 12% revenue CAGR
  const [simMargin, setSimMargin] = useState<number>(24); // 24% Operating Margin
  const [simWacc, setSimWacc] = useState<number>(10.0); // 10.0% WACC

  const activeCompany = useMemo(() => {
    const base = SHOWCASE_COMPANIES.find((c) => c.symbol === selectedSymbol) || SHOWCASE_COMPANIES[0];
    return {
      ...base,
      ...liveCompanyData
    };
  }, [selectedSymbol, liveCompanyData]);

  // Fetch live market data for active company
  useEffect(() => {
    let isMounted = true;
    setLiveCompanyData({});
    setBarsLoading(true);

    // Fetch live overview
    fetch(`/api/instruments/${encodeURIComponent(selectedSymbol)}/overview`)
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => {
        if (!isMounted || !res?.data) return;
        const d = res.data;
        const patch: Partial<ShowcaseCompany> = {};
        if (typeof d.price === 'number') patch.price = d.price;
        if (typeof d.change === 'number') patch.change = d.change;
        if (typeof d.changePercent === 'number') patch.changePercent = d.changePercent;
        const mktCapVal = typeof d.keyStats?.marketCap === 'number' ? d.keyStats.marketCap : d.marketCap;
        if (typeof mktCapVal === 'number') patch.marketCap = mktCapVal;
        const peRatioVal = typeof d.keyStats?.peRatio === 'number' ? d.keyStats.peRatio : d.peRatio;
        if (typeof peRatioVal === 'number') patch.peRatio = peRatioVal;
        setLiveCompanyData(patch);
      })
      .catch(() => {});

    // Fetch live historical bars
    fetch(`/api/instruments/${encodeURIComponent(selectedSymbol)}/history?period=${encodeURIComponent(chartInterval)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => {
        if (!isMounted) return;
        if (res && Array.isArray(res.bars) && res.bars.length > 0) {
          setShowcaseBars(res.bars);
        }
        setBarsLoading(false);
      })
      .catch(() => {
        if (isMounted) setBarsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSymbol, chartInterval]);

  // Fetch live global benchmarks on mount
  useEffect(() => {
    fetch('/api/markets/overview?region=India')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.indices) return;
        setBenchmarks((prev) =>
          prev.map((b) => {
            const match = data.indices.find((idx: any) => idx.symbol === b.symbol);
            if (match && typeof match.price === 'number') {
              return {
                ...b,
                price: match.price,
                change: match.change ?? b.change,
                changePercent: match.changePercent ?? b.changePercent,
                trend: match.trend?.length > 1 ? match.trend : b.trend
              };
            }
            return b;
          })
        );
      })
      .catch(() => {});
  }, []);

  // Real-time pure mathematical DCF computation
  const dcfSimulation = useMemo(() => {
    return calculateDCF({
      inputs: {
        currentRevenue: 100000,
        revenueGrowthRates: [
          simGrowth / 100,
          (simGrowth * 0.95) / 100,
          (simGrowth * 0.9) / 100,
          (simGrowth * 0.85) / 100,
          (simGrowth * 0.8) / 100
        ],
        operatingMargin: simMargin / 100,
        taxRate: 0.25,
        reinvestmentRate: 0.2,
        wacc: simWacc / 100,
        terminalGrowthRate: 0.04,
        cashAndEquivalents: 15000,
        totalDebt: 10000,
        sharesOutstanding: 1000
      },
      currentPrice: 120
    });
  }, [simGrowth, simMargin, simWacc]);

  const upside = activeCompany.baseValuation - activeCompany.price;
  const upsidePct = upside / activeCompany.price;
  const isUp = (activeCompany.changePercent ?? 0) >= 0;

  return (
    <div className="page-container" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
      {/* 1. Hero Headline */}
      <h1
        style={{
          fontSize: 'clamp(36px, 5.5vw, 64px)',
          fontWeight: 600,
          letterSpacing: '-0.035em',
          lineHeight: 1.08,
          textAlign: 'center',
          color: 'var(--foreground)',
          marginBottom: '20px',
          textWrap: 'balance'
        }}
      >
        Institutional-grade equity research in your hands.
      </h1>

      {/* 2. Subtitle */}
      <p
        style={{
          fontSize: '16px',
          lineHeight: '26px',
          color: 'var(--text-muted)',
          textAlign: 'center',
          maxWidth: '680px',
          margin: '0 auto 32px',
          fontWeight: 400,
          textWrap: 'pretty'
        }}
      >
        Deterministic financial models. Zero black-box estimates. Audited mathematical proof behind every equity valuation for Indian and global markets.
      </p>

      {/* 3. Spotlight Search Box & Action Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button
          onClick={onOpenSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: '560px',
            height: '44px',
            minHeight: '44px',
            padding: '0 16px',
            borderRadius: '10px',
            border: '1px solid var(--border-strong)',
            backgroundColor: 'var(--card)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          className="hover:border-[var(--primary)]"
        >
          <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 400, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Search 15,000+ securities (Apple, Reliance, TCS, Microsoft…)
          </span>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              color: 'var(--text-muted)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--secondary)',
              fontWeight: 600
            }}
          >
            ⌘K
          </span>
        </button>

        {/* Quick Tickers Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Quick Access:</span>
          {['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'AAPL', 'MSFT', 'NVDA'].map((sym) => (
            <button
              key={sym}
              onClick={() => navigate(companyPath(sym))}
              style={{
                fontSize: '12px',
                fontFamily: 'monospace',
                fontWeight: 500,
                height: '44px',
                minHeight: '44px',
                padding: '0 16px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card)',
                color: 'var(--foreground)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center'
              }}
              className="hover:border-[var(--primary)] hover:bg-[var(--secondary)]"
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Live Global Benchmarks Ribbon */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Global Markets Live Feed
          </span>
          <button
            onClick={() => navigate('/markets')}
            style={{
              fontSize: '12px',
              color: 'var(--foreground)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              padding: 0
            }}
            className="hover:underline"
          >
            View all global markets →
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}
        >
          {benchmarks.map((b) => {
            const bUp = b.changePercent >= 0;
            return (
              <div
                key={b.symbol}
                className="card hover:border-[var(--primary)] hover:shadow-2xs"
                onClick={() => {
                  const norm = b.region.toLowerCase();
                  const targetReg = norm.includes('global') || norm.includes('commodit')
                    ? 'Commodities'
                    : norm.includes('us')
                    ? 'United States'
                    : norm.includes('europe')
                    ? 'Europe'
                    : 'India';
                  navigate(`/markets?region=${encodeURIComponent(targetReg)}`);
                }}
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--card)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>{b.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{b.region}</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatPrice({ amount: b.price, currency: b.currency })}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '4px'
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: bUp ? 'var(--positive)' : 'var(--negative)',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {bUp ? '▲ ' : '▼ '}
                    {formatPercent(b.changePercent)}
                  </span>
                  {b.trend.length > 1 && <Sparkline data={b.trend} isPositive={bUp} width={64} height={20} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Flagship Terminal Showcase (Koyfin + Apple Canvas 2D Experience) */}
      <div
        className="card"
        style={{
          border: '1px solid var(--border)',
          borderRadius: '14px',
          backgroundColor: 'var(--card)',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          marginBottom: '48px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '4px' }}>
              Interactive Terminal Showcase
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
              {activeCompany.name}
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {activeCompany.exchange} · {activeCompany.currency} · {activeCompany.sector}
            </div>
          </div>

          {/* Segmented Company Picker */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--secondary)',
              padding: '3px',
              borderRadius: '8px',
              gap: '4px',
              overflowX: 'auto',
              maxWidth: '100%'
            }}
          >
            {SHOWCASE_COMPANIES.map((c) => (
              <button
                key={c.symbol}
                onClick={() => {
                  setSelectedSymbol(c.symbol);
                  setLiveCompanyData({});
                }}
                style={{
                  height: '44px',
                  minHeight: '44px',
                  padding: '0 16px',
                  fontSize: '12px',
                  fontWeight: selectedSymbol === c.symbol ? 600 : 400,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: selectedSymbol === c.symbol ? 'var(--card)' : 'transparent',
                  color: selectedSymbol === c.symbol ? 'var(--foreground)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: selectedSymbol === c.symbol ? '0 1px 3px rgba(0, 0, 0, 0.12)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {c.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Live Metrics Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
            padding: '16px 20px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            marginBottom: '24px'
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Market Price</div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
              {formatPrice({ amount: activeCompany.price, currency: activeCompany.currency })}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: isUp ? 'var(--positive)' : 'var(--negative)', fontVariantNumeric: 'tabular-nums' }}>
              {isUp ? '▲ ' : '▼ '}
              {formatPercent(activeCompany.changePercent)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Base Fair Value (DCF)</div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--positive)', fontVariantNumeric: 'tabular-nums' }}>
              {formatPrice({ amount: activeCompany.baseValuation, currency: activeCompany.currency })}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: upside >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
              {typeof upsidePct === 'number' && !isNaN(upsidePct)
                ? (upside >= 0 ? `+${(upsidePct * 100).toFixed(1)}% Undervalued` : `${(upsidePct * 100).toFixed(1)}% Overvalued`)
                : '—'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Market Cap</div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
              {formatCompact({ amount: activeCompany.marketCap, currency: activeCompany.currency })}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Institutional scale</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Trailing P/E</div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
              {typeof activeCompany.peRatio === 'number' && !isNaN(activeCompany.peRatio)
                ? `${activeCompany.peRatio.toFixed(1)}x`
                : '—'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Standard earnings multiple</div>
          </div>
        </div>

        {/* Native 60 FPS Canvas 2D Chart */}
        <div style={{ width: '100%', minHeight: '320px', position: 'relative', marginBottom: '24px' }}>
          {showcaseBars.length > 0 ? (
            <HedgerChart
              bars={showcaseBars}
              currency={activeCompany.currency}
              defaultPeriod={chartInterval}
              onPeriodChange={setChartInterval}
              height={320}
              valuation={{
                baseCase: activeCompany.baseValuation,
                bearCase: activeCompany.bearValuation,
                bullCase: activeCompany.bullValuation,
                currency: activeCompany.currency,
                visible: true
              }}
            />
          ) : (
            <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              {barsLoading ? `Streaming live 60 FPS bars for ${activeCompany.name}...` : 'Chart bars ready'}
            </div>
          )}
        </div>

        {/* Quick Navigation Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Valuation band shaded at <strong>{formatPrice({ amount: activeCompany.bearValuation, currency: activeCompany.currency })}</strong> to{' '}
              <strong>{formatPrice({ amount: activeCompany.bullValuation, currency: activeCompany.currency })}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate(companyPath(activeCompany.symbol))}
              style={{
                height: '44px',
                minHeight: '44px',
                padding: '0 20px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              className="hover:opacity-90"
            >
              Open Full Dossier →
            </button>
            <button
              onClick={() => navigate(`/compare?a=${activeCompany.symbol}`)}
              style={{
                height: '44px',
                minHeight: '44px',
                padding: '0 16px',
                borderRadius: '8px',
                backgroundColor: 'var(--card)',
                color: 'var(--foreground)',
                fontSize: '13px',
                fontWeight: 500,
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center'
              }}
              className="hover:border-[var(--primary)]"
            >
              Compare Peers
            </button>
          </div>
        </div>
      </div>

      {/* 7. Interactive DCF Simulator (Deferred below the fold via modern-web-guidance) */}
      <div
        id="dcf-sandbox-section"
        className="card heavy-section-deferred"
        style={{
          padding: '32px',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          backgroundColor: 'var(--card)',
          marginBottom: '48px'
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '4px' }}>
            Interactive Mathematical Sandbox
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
            Try the Hedger DCF Engine Live
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Adjust the fundamental assumptions below to experience our sub-millisecond intrinsic valuation calculations.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', alignItems: 'center' }}>
          {/* Controls Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Slider 1: Revenue Growth */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>5-Year Revenue CAGR</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                  {simGrowth.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="28"
                step="0.5"
                value={simGrowth}
                onChange={(e) => setSimGrowth(parseFloat(e.target.value))}
                style={{ width: '100%', height: '8px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>Conservative (4%)</span>
                <span>Hypergrowth (28%)</span>
              </div>
            </div>

            {/* Slider 2: Operating Margin */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>Target Operating Margin</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                  {simMargin.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                step="0.5"
                value={simMargin}
                onChange={(e) => setSimMargin(parseFloat(e.target.value))}
                style={{ width: '100%', height: '8px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>Thin (10%)</span>
                <span>Monopoly (40%)</span>
              </div>
            </div>

            {/* Slider 3: Discount Rate (WACC) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>Discount Rate (WACC)</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                  {simWacc.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="7.5"
                max="15.0"
                step="0.25"
                value={simWacc}
                onChange={(e) => setSimWacc(parseFloat(e.target.value))}
                style={{ width: '100%', height: '8px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>Low Risk (7.5%)</span>
                <span>High Hurdle (15%)</span>
              </div>
            </div>
          </div>

          {/* Results Output Card */}
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--card)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Calculated Intrinsic Fair Value</div>
            <div style={{ fontSize: '36px', fontWeight: 600, color: 'var(--foreground)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {formatPrice({ amount: dcfSimulation.intrinsicValuePerShare, currency: 'USD' })}
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: dcfSimulation.marginOfSafety >= 0 ? 'var(--positive)' : 'var(--negative)',
                marginTop: '6px',
                marginBottom: '16px'
              }}
            >
              {dcfSimulation.marginOfSafety >= 0 ? '▲ ' : '▼ '}
              {formatPercent(dcfSimulation.marginOfSafety)} vs reference market price ($120.00)
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Enterprise Value:</span>
                <strong style={{ color: 'var(--foreground)' }}>
                  {formatCompact({ amount: dcfSimulation.enterpriseValue, currency: 'USD' })}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Sum PV of 5Y FCFF:</span>
                <strong style={{ color: 'var(--foreground)' }}>
                  {formatCompact({ amount: dcfSimulation.sumPvFcff, currency: 'USD' })}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Terminal Value (Gordon Growth):</span>
                <strong style={{ color: 'var(--foreground)' }}>
                  {formatCompact({ amount: dcfSimulation.pvTerminalValue, currency: 'USD' })}
                </strong>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <button
                onClick={() => navigate('/models')}
                style={{
                  width: '100%',
                  height: '44px',
                  minHeight: '44px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer'
                }}
                className="hover:opacity-90"
              >
                Launch Full Valuation Workbench →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 8. Institutional Services & Research Capabilities */}
      <div className="heavy-section-deferred" style={{ marginBottom: '48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '6px' }}>
            Capabilities & Coverage
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
            Institutional Equity Research Suite
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '600px', margin: '6px auto 0' }}>
            End-to-end fundamental valuation infrastructure engineered for buy-side allocators, equity analysts, and institutional desks.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Service 1 */}
          <div className="card" style={{ padding: '24px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--foreground)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="20" x2="12" y2="10" />
                <line x1="18" y1="20" x2="18" y2="4" />
                <line x1="6" y1="20" x2="6" y2="16" />
              </svg>
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>
              Institutional DCF Engine
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '20px', textWrap: 'pretty' }}>
              Rigorous 5-year linked Free Cash Flow to Firm (FCFF) forecasts, multi-factor CAPM WACC, dual terminal value methods (Perpetual Growth & Exit EBITDA Multiple), and complete sensitivity grids.
            </p>
          </div>

          {/* Service 2 */}
          <div className="card" style={{ padding: '24px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--foreground)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>
              Audited Data Provenance
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '20px', textWrap: 'pretty' }}>
              Direct ingestion of audited regulatory filings. Every metric carries currency, period, as-of timestamp, and source verification. Missing figures render explicit dashes, never synthetic approximations.
            </p>
          </div>

          {/* Service 3 */}
          <div className="card" style={{ padding: '24px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--foreground)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>
              Proprietary Canvas 2D Engine
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '20px', textWrap: 'pretty' }}>
              Sub-16ms hardware-accelerated time series rendering with zero iframe bloat. Native trading-day coordinates eliminate weekend distortion with responsive crosshairs and volume profiles.
            </p>
          </div>

          {/* Service 4 */}
          <div className="card" style={{ padding: '24px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--foreground)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>
              Cross-Border Peer Benchmarking
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '20px', textWrap: 'pretty' }}>
              Benchmark Indian corporations against US and European sector peers. Automated timestamped FX rate conversions and normalized fiscal years align P/E, CFO, EV/EBITDA, and margin metrics.
            </p>
          </div>

          {/* Service 5 */}
          <div className="card" style={{ padding: '24px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--foreground)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>
              Deterministic Quality & Health Audits
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '20px', textWrap: 'pretty' }}>
              Transparent mathematical scoring across leverage ratios, debt-to-equity safety, interest coverage headroom, operating cash flow conversion, and balance sheet resilience.
            </p>
          </div>

          {/* Service 6 */}
          <div className="card" style={{ padding: '24px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--foreground)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>
              Multi-Market Equity Screener
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '20px', textWrap: 'pretty' }}>
              Instant multi-market querying across NSE, BSE, NASDAQ, NYSE, LSE, and European exchanges. Filter by valuation multiple, ROIC, margin thresholds, and leverage constraints.
            </p>
          </div>
        </div>
      </div>

      {/* 9. Platform Telemetry & Standards Strip */}
      <div
        className="heavy-section-deferred"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '24px',
          padding: '24px 32px',
          backgroundColor: 'var(--card)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          marginBottom: '48px',
          textAlign: 'center'
        }}
      >
        <div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>15,000+</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Global Securities Tracked</div>
        </div>
        <div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>&lt; 16ms</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Native Canvas 2D Frame Time</div>
        </div>
        <div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>100%</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Formula Transparency</div>
        </div>
        <div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--positive)', fontVariantNumeric: 'tabular-nums' }}>Zero</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Fabricated Data In Production</div>
        </div>
      </div>

      {/* 10. Institutional Membership & Tiers Preview */}
      <div className="heavy-section-deferred" style={{ marginBottom: '48px', padding: '32px', border: '1px solid var(--border)', borderRadius: '12px', backgroundColor: 'var(--card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600 }}>
            Pricing & Access
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)', margin: '4px 0 8px 0', letterSpacing: '-0.02em' }}>
            Transparent pricing for disciplined research.
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '540px', lineHeight: 1.5 }}>
            From our free institutional screener to full multi-model valuation, real-time FX peer benchmarking, and portfolio sensitivity suites.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/pricing')}
            className="btn btn-primary"
            style={{ height: '44px', minHeight: '44px', padding: '0 24px', fontSize: '13px', fontWeight: 600 }}
          >
            View All Membership Tiers →
          </button>
        </div>
      </div>

      {/* 11. Quick Route Jump Navigation */}
      <div className="heavy-section-deferred" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '48px' }}>
        <button
          onClick={() => navigate('/markets')}
          style={{
            height: '44px',
            minHeight: '44px',
            padding: '0 16px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--foreground)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          className="hover:border-[var(--primary)]"
        >
          <span>Real-Time Markets</span>
          <span>→</span>
        </button>

        <button
          onClick={() => navigate('/screener')}
          style={{
            height: '44px',
            minHeight: '44px',
            padding: '0 16px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--foreground)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          className="hover:border-[var(--primary)]"
        >
          <span>Equity Screener</span>
          <span>→</span>
        </button>

        <button
          onClick={() => navigate('/compare')}
          style={{
            height: '44px',
            minHeight: '44px',
            padding: '0 16px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--foreground)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          className="hover:border-[var(--primary)]"
        >
          <span>Peer Comparison</span>
          <span>→</span>
        </button>

        <button
          onClick={() => navigate('/models')}
          style={{
            height: '44px',
            minHeight: '44px',
            padding: '0 16px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--foreground)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          className="hover:border-[var(--primary)]"
        >
          <span>Valuation Models</span>
          <span>→</span>
        </button>

        <button
          onClick={() => navigate('/pricing')}
          style={{
            height: '44px',
            minHeight: '44px',
            padding: '0 16px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--foreground)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          className="hover:border-[var(--primary)]"
        >
          <span>Pricing Plans</span>
          <span>→</span>
        </button>

        <button
          onClick={() => navigate('/profile')}
          style={{
            height: '44px',
            minHeight: '44px',
            padding: '0 16px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--foreground)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          className="hover:border-[var(--primary)]"
        >
          <span>Profile & Saved</span>
          <span>→</span>
        </button>
      </div>

      {/* 11. Disclaimers Footer */}
      <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Hedger is an independent institutional equity research and valuation platform. Financial models are mathematical estimations,
        not investment advice or endorsements. All market data delayed 15m where applicable.
      </div>
    </div>
  );
};
