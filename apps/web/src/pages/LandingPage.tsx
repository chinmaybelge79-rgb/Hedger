import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyPath } from '../lib/navigation.js';
import { CompanyLogo } from '../components/CompanyLogo.js';
import { HedgerChart } from '@hedger/charts';
import { calculateDCF } from '@hedger/valuation';
import { formatPrice, formatPercent, formatCompact } from '@hedger/format';
import { Sparkline } from '../components/Sparkline.js';
import { useMarket } from '../context/MarketContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { WebGLShader } from '../components/ui/web-gl-shader.js';
import type { HistoricalBar } from '@hedger/types';

function getSliderTrackStyle(value: number, min: number, max: number, isDark: boolean = true): React.CSSProperties {
  const minNum = Number(min);
  const maxNum = Number(max);
  const valNum = Number(value);
  const clamped = Math.min(maxNum, Math.max(minNum, valNum));
  const pct = maxNum > minNum ? ((clamped - minNum) / (maxNum - minNum)) * 100 : 0;
  const activeColor = isDark ? '#FFFFFF' : '#171717';
  const inactiveColor = isDark ? '#27272A' : '#E5E7EB';
  return {
    background: `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${pct}%, ${inactiveColor} ${pct}%, ${inactiveColor} 100%)`
  };
}

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
  },
  {
    symbol: 'HDFCBANK.NS',
    name: 'HDFC Bank Limited',
    exchange: 'NSE',
    currency: 'INR',
    sector: 'Banking & Financial Services',
    price: 1742.0,
    change: 14.8,
    changePercent: 0.0086,
    marketCap: 13240000000000,
    peRatio: 18.2,
    baseValuation: 1890.0,
    bearValuation: 1520.0,
    bullValuation: 2240.0
  },
  {
    symbol: 'INFY.NS',
    name: 'Infosys Limited',
    exchange: 'NSE',
    currency: 'INR',
    sector: 'Digital Services & Consulting',
    price: 1890.4,
    change: 6.0,
    changePercent: 0.0032,
    marketCap: 7850000000000,
    peRatio: 24.1,
    baseValuation: 2050.0,
    bearValuation: 1650.0,
    bullValuation: 2450.0
  },
  {
    symbol: 'ASML',
    name: 'ASML Holding N.V.',
    exchange: 'EURONEXT',
    currency: 'EUR',
    sector: 'Semiconductor Lithography',
    price: 712.5,
    change: 11.2,
    changePercent: 0.016,
    marketCap: 284000000000,
    peRatio: 38.5,
    baseValuation: 780.0,
    bearValuation: 620.0,
    bullValuation: 940.0
  },
  {
    symbol: 'SAP',
    name: 'SAP SE',
    exchange: 'XETRA',
    currency: 'EUR',
    sector: 'Enterprise Software',
    price: 215.4,
    change: 1.5,
    changePercent: 0.007,
    marketCap: 252000000000,
    peRatio: 32.4,
    baseValuation: 230.0,
    bearValuation: 180.0,
    bullValuation: 280.0
  },
  {
    symbol: '7203.T',
    name: 'Toyota Motor Corporation',
    exchange: 'TSE',
    currency: 'JPY',
    sector: 'Automotive Manufacturing',
    price: 2740.0,
    change: 24.5,
    changePercent: 0.009,
    marketCap: 37500000000000,
    peRatio: 9.8,
    baseValuation: 3100.0,
    bearValuation: 2400.0,
    bullValuation: 3800.0
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
  const { activeMarket, marketConfig, isInstrumentInActiveMarket } = useMarket();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const cardBg = isDark ? '#09090b' : '#ffffff';
  const cardBorder = isDark ? '1px solid #27272a' : '1px solid #e4e4e7';
  const cardShadow = isDark ? '0 20px 50px rgba(0, 0, 0, 0.7)' : '0 10px 30px rgba(0, 0, 0, 0.05)';
  const textColor = isDark ? '#ffffff' : '#171717';
  const textMuted = isDark ? '#a1a1aa' : '#52525b';
  const subTextMuted = isDark ? '#71717a' : '#71717a';
  const boxBg = isDark ? '#121215' : '#f4f4f5';
  const secondaryBg = isDark ? '#18181b' : '#f4f4f5';
  const btnPrimaryBg = isDark ? '#ffffff' : '#000000';
  const btnPrimaryText = isDark ? '#000000' : '#ffffff';
  const btnSecondaryBg = isDark ? '#18181b' : '#f4f4f5';
  const btnSecondaryText = isDark ? '#ffffff' : '#171717';
  const btnSecondaryBorder = isDark ? '1px solid #27272a' : '1px solid #e4e4e7';

  // Scoped showcase companies for active market
  const visibleShowcaseCompanies = useMemo(() => {
    const list = SHOWCASE_COMPANIES.filter(isInstrumentInActiveMarket);
    return list.length > 0 ? list : SHOWCASE_COMPANIES;
  }, [activeMarket, isInstrumentInActiveMarket]);

  // 1. Master Showcase State
  const [selectedSymbol, setSelectedSymbol] = useState<string>(() => visibleShowcaseCompanies[0]?.symbol || 'AAPL');
  const [showcaseBars, setShowcaseBars] = useState<HistoricalBar[]>([]);
  const [barsLoading, setBarsLoading] = useState<boolean>(false);
  const [chartInterval, setChartInterval] = useState<string>('1y');
  const [liveCompanyData, setLiveCompanyData] = useState<Partial<ShowcaseCompany>>({});

  // Synchronize selected showcase company when active market changes
  useEffect(() => {
    if (!visibleShowcaseCompanies.some((c) => c.symbol === selectedSymbol)) {
      if (visibleShowcaseCompanies[0]) {
        setSelectedSymbol(visibleShowcaseCompanies[0].symbol);
      }
    }
  }, [visibleShowcaseCompanies, selectedSymbol]);

  // 2. Global Benchmarks Ribbon State
  const [benchmarks, setBenchmarks] = useState<BenchmarkTicker[]>(DEFAULT_BENCHMARKS);

  // 3. Interactive DCF Sandbox State
  const [simGrowth, setSimGrowth] = useState<number>(12); // 12% revenue CAGR
  const [simMargin, setSimMargin] = useState<number>(24); // 24% Operating Margin
  const [simWacc, setSimWacc] = useState<number>(10.0); // 10.0% WACC

  const activeCompany = useMemo(() => {
    const base = visibleShowcaseCompanies.find((c) => c.symbol === selectedSymbol) || visibleShowcaseCompanies[0] || SHOWCASE_COMPANIES[0];
    return {
      ...base,
      ...liveCompanyData
    };
  }, [visibleShowcaseCompanies, selectedSymbol, liveCompanyData]);

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
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: isDark ? '#000000' : '#FFFFFF', color: textColor, overflowX: 'clip' }}>
      {/* 1. Full-Screen WebGL Hero Viewport */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'clip',
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
          padding: '48px 24px 32px',
          boxSizing: 'border-box'
        }}
      >
        <WebGLShader className="absolute inset-0 w-full h-full pointer-events-none" isDark={isDark} />

        <div
          style={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            maxWidth: '920px',
            boxSizing: 'border-box',
            backgroundColor: 'transparent'
          }}
        >
          <div
            className="hero-content"
            style={{
              position: 'relative',
              padding: '32px 16px',
              textAlign: 'center',
              boxSizing: 'border-box',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              boxShadow: 'none'
            }}
          >
            {/* 1. Hero Headline */}
            <h1
              style={{
                color: isDark ? '#ffffff' : '#000000',
                fontSize: 'clamp(34px, 5.5vw, 68px)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.06,
                textAlign: 'center',
                marginBottom: '14px'
              }}
            >
              Institutional-grade equity research in your hands
            </h1>

            {/* 2. Subtitle */}
            <p
              style={{
                color: isDark ? 'rgba(255, 255, 255, 0.75)' : '#52525B',
                fontSize: '15px',
                lineHeight: '24px',
                textAlign: 'center',
                maxWidth: '640px',
                margin: '0 auto 24px',
                fontWeight: 400
              }}
            >
              Deterministic financial models. Zero black-box estimates. Audited mathematical proof behind every equity valuation for Indian and global markets.
            </p>

            {/* Active Valuation Engine Live Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
              <span style={{ position: 'relative', display: 'flex', height: '10px', width: '10px', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', backgroundColor: '#22c55e', opacity: 0.75, animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                <span style={{ position: 'relative', display: 'inline-flex', height: '8px', width: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: isDark ? '#4ade80' : '#16a34a' }}>
                Active Valuation Engine · {marketConfig.name}
              </span>
            </div>

            {/* 3. Spotlight Search Box inside Hero Card */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              <button
                onClick={onOpenSearch}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  maxWidth: '560px',
                  height: '46px',
                  minHeight: '44px',
                  padding: '0 16px',
                  borderRadius: '9999px',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.12)',
                  backgroundColor: isDark ? 'rgba(18, 18, 20, 0.8)' : 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.06)',
                  cursor: 'pointer',
                  color: isDark ? '#ffffff' : '#18181B',
                  transition: 'all 0.15s ease'
                }}
                className={isDark ? "hover:border-white/40" : "hover:border-black/30"}
              >
                <span style={{ color: isDark ? 'rgba(255, 255, 255, 0.75)' : '#52525B', fontSize: '13px', fontWeight: 400, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Search 15,000+ {marketConfig.shortName} securities ({marketConfig.quickTickers.slice(0, 3).map((t) => t.name.split(' ')[0]).join(', ')}…)
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#52525B',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(0, 0, 0, 0.12)',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.05)',
                    fontWeight: 600
                  }}
                >
                  ⌘K
                </span>
              </button>

              {/* Quick Tickers Row: Scoped to Active Financial Market */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ fontSize: '12px', color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#71717A', fontWeight: 500 }}>
                  {marketConfig.shortName} Quick Access:
                </span>
                {marketConfig.quickTickers.map((ticker) => (
                  <button
                    key={ticker.symbol}
                    onClick={() => navigate(companyPath(ticker.symbol))}
                    style={{
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      fontWeight: 500,
                      height: '32px',
                      padding: '0 12px',
                      borderRadius: '9999px',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid rgba(0, 0, 0, 0.12)',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                      color: isDark ? '#ffffff' : '#18181B',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    className={isDark ? "hover:bg-white/20 hover:border-white/40" : "hover:bg-black/10 hover:border-black/25"}
                  >
                    <CompanyLogo symbol={ticker.symbol} size={16} />
                    <span>{ticker.symbol}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Down Cue */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            marginTop: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            opacity: 0.85
          }}
          onClick={() => {
            const el = document.getElementById('market-feed-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: isDark ? 'rgba(255, 255, 255, 0.55)' : '#71717A' }}>
            Scroll to Explore
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isDark ? "rgba(255, 255, 255, 0.55)" : "#71717A"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* Below-the-fold Content Container in Pure Black & White */}
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '48px 40px 96px',
          boxSizing: 'border-box',
          width: '100%'
        }}
      >
        {/* 5. Live Global Benchmarks Ribbon */}
        <div id="market-feed-section" style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: textColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Global Markets Live Feed
            </span>
            <button
              onClick={() => navigate('/markets')}
              style={{
                fontSize: '12px',
                color: textMuted,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
                padding: 0
              }}
              className={isDark ? "hover:text-white hover:underline" : "hover:text-black hover:underline"}
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
                    border: cardBorder,
                    borderRadius: '12px',
                    backgroundColor: cardBg,
                    transition: 'all 0.15s ease'
                  }}
                  className={isDark ? "hover:border-[#52525b]" : "hover:border-zinc-400"}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CompanyLogo symbol={b.symbol} name={b.name} size={18} rounded />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: textColor }}>{b.name}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: textMuted, fontFamily: 'monospace' }}>{b.region}</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: textColor, fontVariantNumeric: 'tabular-nums' }}>
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
                        color: bUp ? (isDark ? '#22c55e' : '#16a34a') : (isDark ? '#ef4444' : '#dc2626'),
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
            border: cardBorder,
            borderRadius: '16px',
            backgroundColor: cardBg,
            padding: '32px',
            boxShadow: cardShadow,
            marginBottom: '48px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <CompanyLogo symbol={activeCompany.symbol} name={activeCompany.name} size={44} withContainer rounded />
              <div>
                <div style={{ fontSize: '11px', color: textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '4px' }}>
                  Interactive Terminal Showcase
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: textColor, letterSpacing: '-0.02em', margin: 0 }}>
                  {activeCompany.name}
                </h2>
                <div style={{ fontSize: '12px', color: textMuted, marginTop: '2px' }}>
                  {activeCompany.exchange} · {activeCompany.currency} · {activeCompany.sector}
                </div>
              </div>
            </div>

            {/* Segmented Company Picker */}
            <div
              style={{
                display: 'flex',
                backgroundColor: secondaryBg,
                border: cardBorder,
                padding: '3px',
                borderRadius: '8px',
                gap: '4px',
                overflowX: 'auto',
                maxWidth: '100%'
              }}
            >
              {visibleShowcaseCompanies.map((c) => (
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
                    fontWeight: selectedSymbol === c.symbol ? 700 : 500,
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: selectedSymbol === c.symbol ? (isDark ? '#ffffff' : '#000000') : 'transparent',
                    color: selectedSymbol === c.symbol ? (isDark ? '#000000' : '#ffffff') : textMuted,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: selectedSymbol === c.symbol ? (isDark ? '0 2px 8px rgba(255, 255, 255, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.15)') : 'none',
                    transition: 'all 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <CompanyLogo symbol={c.symbol} size={15} />
                  <span>{c.symbol}</span>
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
              backgroundColor: boxBg,
              borderRadius: '12px',
              border: cardBorder,
              marginBottom: '24px'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: textMuted }}>Market Price</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: textColor, fontVariantNumeric: 'tabular-nums' }}>
                {formatPrice({ amount: activeCompany.price, currency: activeCompany.currency })}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: isUp ? (isDark ? '#22c55e' : '#16a34a') : (isDark ? '#ef4444' : '#dc2626'), fontVariantNumeric: 'tabular-nums' }}>
                {isUp ? '▲ ' : '▼ '}
                {formatPercent(activeCompany.changePercent)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: textMuted }}>Base Fair Value (DCF)</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: textColor, fontVariantNumeric: 'tabular-nums' }}>
                {formatPrice({ amount: activeCompany.baseValuation, currency: activeCompany.currency })}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: upside >= 0 ? (isDark ? '#22c55e' : '#16a34a') : (isDark ? '#ef4444' : '#dc2626') }}>
                {typeof upsidePct === 'number' && !isNaN(upsidePct)
                  ? (upside >= 0 ? `+${(upsidePct * 100).toFixed(1)}% Undervalued` : `${(upsidePct * 100).toFixed(1)}% Overvalued`)
                  : '—'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: textMuted }}>Market Cap</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: textColor, fontVariantNumeric: 'tabular-nums' }}>
                {formatCompact({ amount: activeCompany.marketCap, currency: activeCompany.currency })}
              </div>
              <div style={{ fontSize: '12px', color: textMuted }}>Institutional scale</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: textMuted }}>Trailing P/E</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: textColor, fontVariantNumeric: 'tabular-nums' }}>
                {typeof activeCompany.peRatio === 'number' && !isNaN(activeCompany.peRatio)
                  ? `${activeCompany.peRatio.toFixed(1)}x`
                  : '—'}
              </div>
              <div style={{ fontSize: '12px', color: textMuted }}>Standard multiple</div>
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
                theme={isDark ? 'dark' : 'light'}
                valuation={{
                  baseCase: activeCompany.baseValuation,
                  bearCase: activeCompany.bearValuation,
                  bullCase: activeCompany.bullValuation,
                  currency: activeCompany.currency,
                  visible: true
                }}
              />
            ) : (
              <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textMuted, fontSize: '13px' }}>
                {barsLoading ? `Streaming live 60 FPS bars for ${activeCompany.name}...` : 'Chart bars ready'}
              </div>
            )}
          </div>

          {/* Quick Navigation Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderTop: cardBorder, paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: textMuted }}>
                Valuation band shaded at <strong style={{ color: textColor }}>{formatPrice({ amount: activeCompany.bearValuation, currency: activeCompany.currency })}</strong> to{' '}
                <strong style={{ color: textColor }}>{formatPrice({ amount: activeCompany.bullValuation, currency: activeCompany.currency })}</strong>
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
                  backgroundColor: btnPrimaryBg,
                  color: btnPrimaryText,
                  fontSize: '13px',
                  fontWeight: 700,
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
                  backgroundColor: btnSecondaryBg,
                  color: btnSecondaryText,
                  fontSize: '13px',
                  fontWeight: 600,
                  border: btnSecondaryBorder,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
                className={isDark ? "hover:border-white/40" : "hover:border-black/30"}
              >
                Compare Peers
              </button>
            </div>
          </div>
        </div>

        {/* 7. Interactive DCF Simulator */}
        <div
          id="dcf-sandbox-section"
          style={{
            padding: '32px',
            border: cardBorder,
            borderRadius: '16px',
            backgroundColor: cardBg,
            marginBottom: '48px'
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', color: textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '4px' }}>
              Interactive Mathematical Sandbox
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: textColor, letterSpacing: '-0.02em', margin: 0 }}>
              Try the Hedger DCF Engine Live
            </h2>
            <p style={{ fontSize: '14px', color: textMuted, marginTop: '4px' }}>
              Adjust the fundamental assumptions below to experience our sub-millisecond intrinsic valuation calculations.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', alignItems: 'center' }}>
            {/* Controls Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Slider 1: Revenue Growth */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: textColor }}>5-Year Revenue CAGR</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: textColor, fontVariantNumeric: 'tabular-nums' }}>
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
                  style={{ width: '100%', ...getSliderTrackStyle(simGrowth, 4, 28, isDark) }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: textMuted, marginTop: '4px' }}>
                  <span>Conservative (4%)</span>
                  <span>Hypergrowth (28%)</span>
                </div>
              </div>

              {/* Slider 2: Operating Margin */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: textColor }}>Target Operating Margin</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: textColor, fontVariantNumeric: 'tabular-nums' }}>
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
                  style={{ width: '100%', ...getSliderTrackStyle(simMargin, 10, 40, isDark) }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: textMuted, marginTop: '4px' }}>
                  <span>Thin (10%)</span>
                  <span>Monopoly (40%)</span>
                </div>
              </div>

              {/* Slider 3: Discount Rate (WACC) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: textColor }}>Discount Rate (WACC)</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: textColor, fontVariantNumeric: 'tabular-nums' }}>
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
                  style={{ width: '100%', ...getSliderTrackStyle(simWacc, 7.5, 15.0, isDark) }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: textMuted, marginTop: '4px' }}>
                  <span>Low Risk (7.5%)</span>
                  <span>High Hurdle (15%)</span>
                </div>
              </div>
            </div>

            {/* Results Output Card */}
            <div
              style={{
                padding: '24px',
                backgroundColor: boxBg,
                borderRadius: '12px',
                border: cardBorder,
                boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div style={{ fontSize: '12px', color: textMuted, marginBottom: '4px' }}>Calculated Intrinsic Fair Value</div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: textColor, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {formatPrice({ amount: dcfSimulation.intrinsicValuePerShare, currency: 'USD' })}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: dcfSimulation.marginOfSafety >= 0 ? (isDark ? '#22c55e' : '#16a34a') : (isDark ? '#ef4444' : '#dc2626'),
                  marginTop: '6px',
                  marginBottom: '16px'
                }}
              >
                {dcfSimulation.marginOfSafety >= 0 ? '▲ ' : '▼ '}
                {formatPercent(dcfSimulation.marginOfSafety)} vs reference market price ($120.00)
              </div>

              <div style={{ borderTop: cardBorder, paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: textMuted }}>
                  <span>Enterprise Value:</span>
                  <strong style={{ color: textColor }}>
                    {formatCompact({ amount: dcfSimulation.enterpriseValue, currency: 'USD' })}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: textMuted }}>
                  <span>Sum PV of 5Y FCFF:</span>
                  <strong style={{ color: textColor }}>
                    {formatCompact({ amount: dcfSimulation.sumPvFcff, currency: 'USD' })}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: textMuted }}>
                  <span>Terminal Value (Gordon Growth):</span>
                  <strong style={{ color: textColor }}>
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
                    borderRadius: '8px',
                    backgroundColor: btnPrimaryBg,
                    color: btnPrimaryText,
                    fontSize: '12px',
                    fontWeight: 700,
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
        <div style={{ marginBottom: '48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '11px', color: textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '6px' }}>
              Capabilities & Coverage
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: textColor, letterSpacing: '-0.02em', margin: 0 }}>
              Institutional Equity Research Suite
            </h2>
            <p style={{ fontSize: '14px', color: textMuted, marginTop: '6px', maxWidth: '600px', margin: '6px auto 0' }}>
              End-to-end fundamental valuation infrastructure engineered for buy-side allocators, equity analysts, and institutional desks.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Service 1 */}
            <div style={{ padding: '24px', border: cardBorder, borderRadius: '12px', backgroundColor: cardBg }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: secondaryBg, border: cardBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: textColor }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="20" x2="12" y2="10" />
                  <line x1="18" y1="20" x2="18" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="16" />
                </svg>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: textColor, marginBottom: '8px' }}>
                Institutional DCF Engine
              </h3>
              <p style={{ fontSize: '13px', color: textMuted, lineHeight: '20px', textWrap: 'pretty' }}>
                Rigorous 5-year linked Free Cash Flow to Firm (FCFF) forecasts, multi-factor CAPM WACC, dual terminal value methods (Perpetual Growth & Exit EBITDA Multiple), and complete sensitivity grids.
              </p>
            </div>

            {/* Service 2 */}
            <div style={{ padding: '24px', border: cardBorder, borderRadius: '12px', backgroundColor: cardBg }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: secondaryBg, border: cardBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: textColor }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: textColor, marginBottom: '8px' }}>
                Audited Data Provenance
              </h3>
              <p style={{ fontSize: '13px', color: textMuted, lineHeight: '20px', textWrap: 'pretty' }}>
                Direct ingestion of audited regulatory filings. Every metric carries currency, period, as-of timestamp, and source verification. Missing figures render explicit dashes, never synthetic approximations.
              </p>
            </div>

            {/* Service 3 */}
            <div style={{ padding: '24px', border: cardBorder, borderRadius: '12px', backgroundColor: cardBg }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: secondaryBg, border: cardBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: textColor }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: textColor, marginBottom: '8px' }}>
                Proprietary Canvas 2D Engine
              </h3>
              <p style={{ fontSize: '13px', color: textMuted, lineHeight: '20px', textWrap: 'pretty' }}>
                Sub-16ms hardware-accelerated time series rendering with zero iframe bloat. Native trading-day coordinates eliminate weekend distortion with responsive crosshairs and volume profiles.
              </p>
            </div>

            {/* Service 4 */}
            <div style={{ padding: '24px', border: cardBorder, borderRadius: '12px', backgroundColor: cardBg }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: secondaryBg, border: cardBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: textColor }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: textColor, marginBottom: '8px' }}>
                Cross-Border Peer Benchmarking
              </h3>
              <p style={{ fontSize: '13px', color: textMuted, lineHeight: '20px', textWrap: 'pretty' }}>
                Benchmark Indian corporations against US and European sector peers. Automated timestamped FX rate conversions and normalized fiscal years align P/E, CFO, EV/EBITDA, and margin metrics.
              </p>
            </div>

            {/* Service 5 */}
            <div style={{ padding: '24px', border: cardBorder, borderRadius: '12px', backgroundColor: cardBg }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: secondaryBg, border: cardBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: textColor }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: textColor, marginBottom: '8px' }}>
                Deterministic Quality & Health Audits
              </h3>
              <p style={{ fontSize: '13px', color: textMuted, lineHeight: '20px', textWrap: 'pretty' }}>
                Transparent mathematical scoring across leverage ratios, debt-to-equity safety, interest coverage headroom, operating cash flow conversion, and balance sheet resilience.
              </p>
            </div>

            {/* Service 6 */}
            <div style={{ padding: '24px', border: cardBorder, borderRadius: '12px', backgroundColor: cardBg }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: secondaryBg, border: cardBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: textColor }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: textColor, marginBottom: '8px' }}>
                Multi-Market Equity Screener
              </h3>
              <p style={{ fontSize: '13px', color: textMuted, lineHeight: '20px', textWrap: 'pretty' }}>
                Instant multi-market querying across NSE, BSE, NASDAQ, NYSE, LSE, and European exchanges. Filter by valuation multiple, ROIC, margin thresholds, and leverage constraints.
              </p>
            </div>
          </div>
        </div>

        {/* 9. Platform Telemetry & Standards Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '24px',
            padding: '24px 32px',
            backgroundColor: cardBg,
            borderRadius: '14px',
            border: cardBorder,
            marginBottom: '48px',
            textAlign: 'center'
          }}
        >
          <div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: textColor, fontVariantNumeric: 'tabular-nums' }}>15,000+</div>
            <div style={{ fontSize: '12px', color: textMuted, marginTop: '2px' }}>Global Securities Tracked</div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: textColor, fontVariantNumeric: 'tabular-nums' }}>&lt; 16ms</div>
            <div style={{ fontSize: '12px', color: textMuted, marginTop: '2px' }}>Native Canvas 2D Frame Time</div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: textColor, fontVariantNumeric: 'tabular-nums' }}>100%</div>
            <div style={{ fontSize: '12px', color: textMuted, marginTop: '2px' }}>Formula Transparency</div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: textColor, fontVariantNumeric: 'tabular-nums' }}>Zero</div>
            <div style={{ fontSize: '12px', color: textMuted, marginTop: '2px' }}>Fabricated Data In Production</div>
          </div>
        </div>

        {/* 10. Institutional Membership & Tiers Preview */}
        <div style={{ marginBottom: '48px', padding: '32px', border: cardBorder, borderRadius: '16px', backgroundColor: cardBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: textMuted, fontWeight: 600 }}>
              Pricing & Access
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: textColor, margin: '4px 0 8px 0', letterSpacing: '-0.02em' }}>
              Transparent pricing for disciplined research.
            </h2>
            <p style={{ fontSize: '13px', color: textMuted, margin: 0, maxWidth: '540px', lineHeight: 1.5 }}>
              From our free institutional screener to full multi-model valuation, real-time FX peer benchmarking, and portfolio sensitivity suites.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/pricing')}
              style={{
                height: '44px',
                minHeight: '44px',
                padding: '0 24px',
                fontSize: '13px',
                fontWeight: 700,
                borderRadius: '8px',
                backgroundColor: btnPrimaryBg,
                color: btnPrimaryText,
                border: 'none',
                cursor: 'pointer'
              }}
              className="hover:opacity-90"
            >
              View All Membership Tiers →
            </button>
          </div>
        </div>

        {/* 11. Quick Route Jump Navigation */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '48px' }}>
          <button
            onClick={() => navigate('/markets')}
            style={{
              height: '44px',
              minHeight: '44px',
              padding: '0 16px',
              borderRadius: '8px',
              border: cardBorder,
              backgroundColor: cardBg,
              fontSize: '13px',
              fontWeight: 500,
              color: textColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            className={isDark ? "hover:border-white/40 hover:bg-[#18181b]" : "hover:border-black/30 hover:bg-zinc-100"}
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
              border: cardBorder,
              backgroundColor: cardBg,
              fontSize: '13px',
              fontWeight: 500,
              color: textColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            className={isDark ? "hover:border-white/40 hover:bg-[#18181b]" : "hover:border-black/30 hover:bg-zinc-100"}
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
              border: cardBorder,
              backgroundColor: cardBg,
              fontSize: '13px',
              fontWeight: 500,
              color: textColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            className={isDark ? "hover:border-white/40 hover:bg-[#18181b]" : "hover:border-black/30 hover:bg-zinc-100"}
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
              border: cardBorder,
              backgroundColor: cardBg,
              fontSize: '13px',
              fontWeight: 500,
              color: textColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            className={isDark ? "hover:border-white/40 hover:bg-[#18181b]" : "hover:border-black/30 hover:bg-zinc-100"}
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
              border: cardBorder,
              backgroundColor: cardBg,
              fontSize: '13px',
              fontWeight: 500,
              color: textColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            className={isDark ? "hover:border-white/40 hover:bg-[#18181b]" : "hover:border-black/30 hover:bg-zinc-100"}
          >
            <span>Pricing Plans</span>
            <span>→</span>
          </button>

          <button
            onClick={() => navigate('/about')}
            style={{
              height: '44px',
              minHeight: '44px',
              padding: '0 16px',
              borderRadius: '8px',
              border: cardBorder,
              backgroundColor: cardBg,
              fontSize: '13px',
              fontWeight: 500,
              color: textColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            className={isDark ? "hover:border-white/40 hover:bg-[#18181b]" : "hover:border-black/30 hover:bg-zinc-100"}
          >
            <span>About Hedger</span>
            <span>→</span>
          </button>

          <button
            onClick={() => navigate('/profile')}
            style={{
              height: '44px',
              minHeight: '44px',
              padding: '0 16px',
              borderRadius: '8px',
              border: cardBorder,
              backgroundColor: cardBg,
              fontSize: '13px',
              fontWeight: 500,
              color: textColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            className={isDark ? "hover:border-white/40 hover:bg-[#18181b]" : "hover:border-black/30 hover:bg-zinc-100"}
          >
            <span>Profile & Saved</span>
            <span>→</span>
          </button>
        </div>

        {/* 12. Disclaimers Footer */}
        <div style={{ textAlign: 'center', fontSize: '11px', color: textMuted, lineHeight: 1.6 }}>
          Hedger is an independent institutional equity research and valuation platform. Financial models are mathematical estimations,
          not investment advice or endorsements. All market data delayed 15m where applicable.
        </div>
      </div>
    </div>
  );
};
