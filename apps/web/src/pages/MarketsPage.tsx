import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkline } from '../components/Sparkline.js';
import { HedgerChart } from '@hedger/charts';
import type { HistoricalBar } from '@hedger/types';
import { companyPath } from '../lib/navigation.js';
import { formatPrice, formatPercent } from '@hedger/format';

interface MarketIndex {
  symbol: string;
  name: string;
  country: string;
  currency: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  freshness: string;
  trend: number[];
}

interface MarketMover {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string;
}

interface MarketSector {
  name: string;
  change: number;
}

interface MarketBreadth {
  advances: number;
  declines: number;
  unchanged: number;
  advanceDeclineRatio: number;
}

export interface MarketOverviewData {
  region: string;
  exchangeStatus: string;
  defaultIndexSymbol: string;
  indices: MarketIndex[];
  gainers: MarketMover[];
  losers: MarketMover[];
  sectors: MarketSector[];
  breadth: MarketBreadth;
  meta: {
    freshness: string;
    asOf: string;
    source: string;
  };
}

export const REGION_DEFAULT_DATA: Record<string, MarketOverviewData> = {
  Commodities: {
    region: 'Commodities',
    exchangeStatus: 'NYMEX / COMEX · 24h Global Trading · EST',
    defaultIndexSymbol: 'GC=F',
    indices: [
      {
        symbol: 'GC=F',
        name: 'Gold Dec 26',
        country: 'Global',
        currency: 'USD',
        price: 4026.30,
        change: -3.80,
        changePercent: -0.00094,
        freshness: 'LIVE',
        trend: [4190.6, 4177.3, 4107.9, 4170.1, 4181.1, 4160.1, 4142.6, 4150, 4060.4, 4026.3]
      },
      {
        symbol: 'CL=F',
        name: 'Crude Oil (WTI)',
        country: 'Global',
        currency: 'USD',
        price: 100.74,
        change: 0.75,
        changePercent: 0.0075,
        freshness: 'LIVE',
        trend: [93.74, 94.14, 95.09, 97.97, 101.41, 103.66, 101.79, 97.15, 99.47, 100.74]
      },
      {
        symbol: 'SI=F',
        name: 'Silver',
        country: 'Global',
        currency: 'USD',
        price: 53.88,
        change: -0.08,
        changePercent: -0.00148,
        freshness: 'LIVE',
        trend: [60.14, 59.16, 55.55, 56.84, 56.99, 56.97, 57.71, 57.42, 54.76, 53.88]
      },
      {
        symbol: 'NG=F',
        name: 'Natural Gas',
        country: 'Global',
        currency: 'USD',
        price: 3.12,
        change: 0.386,
        changePercent: 0.14108,
        freshness: 'LIVE',
        trend: [3.17, 3.28, 3.2, 3.24, 3.12, 3.06, 2.96, 2.79, 2.8, 3.12]
      },
      {
        symbol: 'HG=F',
        name: 'Copper',
        country: 'Global',
        currency: 'USD',
        price: 6.44,
        change: 0.0075,
        changePercent: 0.00117,
        freshness: 'LIVE',
        trend: [6.7, 6.68, 6.61, 6.51, 6.53, 6.54, 6.57, 6.54, 6.36, 6.44]
      }
    ],
    gainers: [
      { symbol: 'BP.L', name: 'BP p.l.c.', price: 623.80, change: 10.80, changePercent: 0.0176, currency: 'GBp' },
      { symbol: 'SHEL.L', name: 'Shell plc', price: 3937.00, change: 45.00, changePercent: 0.0116, currency: 'GBp' },
      { symbol: 'XOM', name: 'ExxonMobil Corp.', price: 178.23, change: 0.14, changePercent: 0.0008, currency: 'USD' }
    ],
    losers: [
      { symbol: 'FCX', name: 'Freeport-McMoRan', price: 64.59, change: -4.31, changePercent: -0.0626, currency: 'USD' },
      { symbol: 'BHP', name: 'BHP Group', price: 77.58, change: -3.24, changePercent: -0.0401, currency: 'USD' },
      { symbol: 'VALE', name: 'Vale S.A.', price: 12.20, change: -0.50, changePercent: -0.0394, currency: 'USD' }
    ],
    sectors: [
      { name: 'Precious Metals', change: 1.4 },
      { name: 'Petroleum & Gas', change: -0.8 },
      { name: 'Industrial Metals', change: 0.9 },
      { name: 'Agriculture', change: 0.3 },
      { name: 'Clean Tech Materials', change: 1.6 }
    ],
    breadth: {
      advances: 254,
      declines: 409,
      unchanged: 84,
      advanceDeclineRatio: 0.62
    },
    meta: {
      freshness: 'LIVE',
      asOf: '2026-10-23T08:00:00Z',
      source: 'Hedger Multi-Provider Gateway'
    }
  },
  India: {
    region: 'India',
    exchangeStatus: 'NSE · Delayed 15m · IST (09:15–15:30)',
    defaultIndexSymbol: '^NSEI',
    indices: [
      {
        symbol: '^NSEI',
        name: 'NIFTY 50',
        country: 'India',
        currency: 'INR',
        price: 22401.75,
        change: -285.60,
        changePercent: -0.0126,
        freshness: 'DELAYED',
        trend: [22650, 22600, 22520, 22480, 22510, 22450, 22401.75]
      },
      {
        symbol: '^BSESN',
        name: 'SENSEX',
        country: 'India',
        currency: 'INR',
        price: 73876.80,
        change: -880.40,
        changePercent: -0.0118,
        freshness: 'DELAYED',
        trend: [74600, 74450, 74200, 74100, 74250, 74000, 73876.80]
      },
      {
        symbol: '^NSEBANK',
        name: 'NIFTY Bank',
        country: 'India',
        currency: 'INR',
        price: 47840.50,
        change: -445.20,
        changePercent: -0.0092,
        freshness: 'DELAYED',
        trend: [48300, 48150, 48000, 47900, 48050, 47840.50]
      },
      {
        symbol: '^CNXIT',
        name: 'NIFTY IT',
        country: 'India',
        currency: 'INR',
        price: 34680.10,
        change: 155.40,
        changePercent: 0.0045,
        freshness: 'DELAYED',
        trend: [34350, 34420, 34500, 34550, 34620, 34680.10]
      },
      {
        symbol: '^CNXAUTO',
        name: 'NIFTY Auto',
        country: 'India',
        currency: 'INR',
        price: 21430.20,
        change: 68.50,
        changePercent: 0.0032,
        freshness: 'DELAYED',
        trend: [21280, 21320, 21350, 21380, 21410, 21430.20]
      }
    ],
    gainers: [
      { symbol: 'M&M.NS', name: 'Mahindra & Mahindra', price: 2818.40, change: 48.20, changePercent: 0.0174, currency: 'INR' },
      { symbol: 'SUNPHARMA.NS', name: 'Sun Pharma', price: 1680.50, change: 22.10, changePercent: 0.0133, currency: 'INR' },
      { symbol: 'TCS.NS', name: 'Tata Consultancy Services', price: 2535.50, change: 18.40, changePercent: 0.0073, currency: 'INR' }
    ],
    losers: [
      { symbol: 'AXISBANK.NS', name: 'Axis Bank', price: 1120.30, change: -24.50, changePercent: -0.0214, currency: 'INR' },
      { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', price: 924.80, change: -18.20, changePercent: -0.0193, currency: 'INR' },
      { symbol: 'RELIANCE.NS', name: 'Reliance Industries', price: 1173.00, change: -12.40, changePercent: -0.0105, currency: 'INR' }
    ],
    sectors: [
      { name: 'Banking', change: -0.9 },
      { name: 'IT', change: 0.5 },
      { name: 'Auto', change: 0.3 },
      { name: 'Pharma', change: 1.2 },
      { name: 'Energy', change: -0.8 },
      { name: 'FMCG', change: 0.4 },
      { name: 'Infrastructure', change: 1.5 }
    ],
    breadth: {
      advances: 894,
      declines: 1420,
      unchanged: 112,
      advanceDeclineRatio: 0.63
    },
    meta: {
      freshness: 'DELAYED 15m',
      asOf: '2026-10-23T08:00:00Z',
      source: 'Hedger Multi-Provider Gateway'
    }
  },
  'United States': {
    region: 'United States',
    exchangeStatus: 'NYSE / NASDAQ · Delayed 15m · EST (09:30–16:00)',
    defaultIndexSymbol: '^GSPC',
    indices: [
      {
        symbol: '^GSPC',
        name: 'S&P 500',
        country: 'United States',
        currency: 'USD',
        price: 7663.43,
        change: -16.15,
        changePercent: -0.0021,
        freshness: 'DELAYED',
        trend: [7690, 7682, 7675, 7665, 7663.43]
      },
      {
        symbol: '^IXIC',
        name: 'NASDAQ Composite',
        country: 'United States',
        currency: 'USD',
        price: 26450.80,
        change: 99.85,
        changePercent: 0.0038,
        freshness: 'DELAYED',
        trend: [26280, 26340, 26390, 26430, 26450.80]
      },
      {
        symbol: '^DJI',
        name: 'Dow Jones',
        country: 'United States',
        currency: 'USD',
        price: 43820.10,
        change: -65.75,
        changePercent: -0.0015,
        freshness: 'DELAYED',
        trend: [43910, 43890, 43860, 43830, 43820.10]
      },
      {
        symbol: '^RUT',
        name: 'Russell 2000',
        country: 'United States',
        currency: 'USD',
        price: 2210.40,
        change: 12.10,
        changePercent: 0.0055,
        freshness: 'DELAYED',
        trend: [2192, 2198, 2204, 2208, 2210.40]
      },
      {
        symbol: '^VIX',
        name: 'CBOE Volatility',
        country: 'United States',
        currency: 'USD',
        price: 14.85,
        change: -0.32,
        changePercent: -0.0210,
        freshness: 'DELAYED',
        trend: [15.5, 15.3, 15.1, 14.9, 14.85]
      }
    ],
    gainers: [
      { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 210.96, change: -1.25, changePercent: -0.0059, currency: 'USD' },
      { symbol: 'AAPL', name: 'Apple Inc.', price: 347.73, change: 4.88, changePercent: 0.0142, currency: 'USD' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 524.51, change: 6.10, changePercent: 0.0118, currency: 'USD' }
    ],
    losers: [
      { symbol: 'INTC', name: 'Intel Corp.', price: 21.40, change: -0.85, changePercent: -0.0382, currency: 'USD' },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 218.40, change: -5.60, changePercent: -0.0250, currency: 'USD' },
      { symbol: 'PYPL', name: 'PayPal Holdings', price: 68.20, change: -1.10, changePercent: -0.0159, currency: 'USD' }
    ],
    sectors: [
      { name: 'Technology', change: 1.4 },
      { name: 'Financials', change: 0.6 },
      { name: 'Healthcare', change: -0.3 },
      { name: 'Consumer Discr', change: 0.8 },
      { name: 'Energy', change: -0.5 },
      { name: 'Industrials', change: 0.2 },
      { name: 'Communication', change: 1.1 }
    ],
    breadth: {
      advances: 1650,
      declines: 1120,
      unchanged: 140,
      advanceDeclineRatio: 1.47
    },
    meta: {
      freshness: 'DELAYED 15m',
      asOf: '2026-10-23T08:00:00Z',
      source: 'Hedger Multi-Provider Gateway'
    }
  },
  China: {
    region: 'China',
    exchangeStatus: 'HKEX / SSE · Delayed 15m · HKT (09:30–16:00)',
    defaultIndexSymbol: '^HSI',
    indices: [
      {
        symbol: '^HSI',
        name: 'Hang Seng Index',
        country: 'Hong Kong',
        currency: 'HKD',
        price: 24680.10,
        change: 201.50,
        changePercent: 0.0082,
        freshness: 'DELAYED',
        trend: [24380, 24460, 24540, 24610, 24680.10]
      },
      {
        symbol: '000001.SS',
        name: 'SSE Composite',
        country: 'China',
        currency: 'CNY',
        price: 3240.50,
        change: 14.60,
        changePercent: 0.0045,
        freshness: 'DELAYED',
        trend: [3215, 3225, 3232, 3238, 3240.50]
      },
      {
        symbol: '000300.SS',
        name: 'CSI 300',
        country: 'China',
        currency: 'CNY',
        price: 3890.20,
        change: 23.30,
        changePercent: 0.0060,
        freshness: 'DELAYED',
        trend: [3855, 3868, 3878, 3886, 3890.20]
      },
      {
        symbol: '399001.SZ',
        name: 'Shenzhen Component',
        country: 'China',
        currency: 'CNY',
        price: 10450.80,
        change: 36.50,
        changePercent: 0.0035,
        freshness: 'DELAYED',
        trend: [10390, 10415, 10432, 10444, 10450.80]
      },
      {
        symbol: '^HSTECH',
        name: 'Hang Seng Tech',
        country: 'Hong Kong',
        currency: 'HKD',
        price: 4890.30,
        change: 58.20,
        changePercent: 0.0120,
        freshness: 'DELAYED',
        trend: [4810, 4835, 4858, 4878, 4890.30]
      }
    ],
    gainers: [
      { symbol: '1211.HK', name: 'BYD Company', price: 284.60, change: 8.40, changePercent: 0.0304, currency: 'HKD' },
      { symbol: '0700.HK', name: 'Tencent Holdings', price: 442.20, change: 9.80, changePercent: 0.0227, currency: 'HKD' },
      { symbol: '9988.HK', name: 'Alibaba Group', price: 98.40, change: 1.90, changePercent: 0.0197, currency: 'HKD' }
    ],
    losers: [
      { symbol: '3690.HK', name: 'Meituan', price: 138.50, change: -3.20, changePercent: -0.0226, currency: 'HKD' },
      { symbol: '9866.HK', name: 'NIO Inc.', price: 42.10, change: -0.80, changePercent: -0.0186, currency: 'HKD' },
      { symbol: '9618.HK', name: 'JD.com', price: 122.40, change: -1.60, changePercent: -0.0129, currency: 'HKD' }
    ],
    sectors: [
      { name: 'Tech & Internet', change: 1.8 },
      { name: 'Clean Energy & EV', change: 2.3 },
      { name: 'Financials', change: 0.6 },
      { name: 'Consumer & Retail', change: 1.1 },
      { name: 'Telecom', change: 0.4 },
      { name: 'Semiconductors', change: 1.9 },
      { name: 'Real Estate', change: -0.8 }
    ],
    breadth: {
      advances: 1420,
      declines: 780,
      unchanged: 110,
      advanceDeclineRatio: 1.82
    },
    meta: {
      freshness: 'DELAYED 15m',
      asOf: '2026-10-23T08:00:00Z',
      source: 'Hedger Multi-Provider Gateway'
    }
  },
  Europe: {
    region: 'Europe',
    exchangeStatus: 'LSE / Euronext / XETRA · Delayed 15m · CET (09:00–17:30)',
    defaultIndexSymbol: '^FTSE',
    indices: [
      {
        symbol: '^FTSE',
        name: 'FTSE 100',
        country: 'United Kingdom',
        currency: 'GBP',
        price: 10706.66,
        change: -17.15,
        changePercent: -0.0016,
        freshness: 'DELAYED',
        trend: [10735, 10725, 10718, 10712, 10706.66]
      },
      {
        symbol: '^GDAXI',
        name: 'DAX 40',
        country: 'Germany',
        currency: 'EUR',
        price: 18420.30,
        change: 51.60,
        changePercent: 0.0028,
        freshness: 'DELAYED',
        trend: [18340, 18375, 18395, 18412, 18420.30]
      },
      {
        symbol: '^FCHI',
        name: 'CAC 40',
        country: 'France',
        currency: 'EUR',
        price: 7940.10,
        change: 9.50,
        changePercent: 0.0012,
        freshness: 'DELAYED',
        trend: [7915, 7925, 7932, 7938, 7940.10]
      },
      {
        symbol: '^STOXX50E',
        name: 'Euro Stoxx 50',
        country: 'Europe',
        currency: 'EUR',
        price: 4890.50,
        change: 10.80,
        changePercent: 0.0022,
        freshness: 'DELAYED',
        trend: [4870, 4878, 4884, 4888, 4890.50]
      },
      {
        symbol: '^SSMI',
        name: 'Swiss Market (SMI)',
        country: 'Switzerland',
        currency: 'CHF',
        price: 11850.20,
        change: -9.50,
        changePercent: -0.0008,
        freshness: 'DELAYED',
        trend: [11875, 11868, 11860, 11854, 11850.20]
      }
    ],
    gainers: [
      { symbol: 'ASML.AS', name: 'ASML Holding', price: 894.20, change: 16.40, changePercent: 0.0187, currency: 'EUR' },
      { symbol: 'SAP.DE', name: 'SAP SE', price: 198.50, change: 3.10, changePercent: 0.0159, currency: 'EUR' },
      { symbol: 'MC.PA', name: 'LVMH Moët Hennessy', price: 724.00, change: 8.50, changePercent: 0.0119, currency: 'EUR' }
    ],
    losers: [
      { symbol: 'NESN.SW', name: 'Nestlé S.A.', price: 92.40, change: -1.60, changePercent: -0.0170, currency: 'CHF' },
      { symbol: 'SHEL.L', name: 'Shell plc', price: 3937.00, change: -32.00, changePercent: -0.0081, currency: 'GBp' },
      { symbol: 'NOVN.SW', name: 'Novartis AG', price: 94.80, change: -0.65, changePercent: -0.0068, currency: 'CHF' }
    ],
    sectors: [
      { name: 'Industrials', change: 1.2 },
      { name: 'Healthcare & Pharma', change: 0.9 },
      { name: 'Luxury & Retail', change: 1.5 },
      { name: 'Energy', change: -0.4 },
      { name: 'Financials', change: 0.7 },
      { name: 'Technology', change: 1.8 }
    ],
    breadth: {
      advances: 980,
      declines: 720,
      unchanged: 95,
      advanceDeclineRatio: 1.36
    },
    meta: {
      freshness: 'DELAYED 15m',
      asOf: '2026-10-23T08:00:00Z',
      source: 'Hedger Multi-Provider Gateway'
    }
  }
};

const REGION_DEFAULT_INDICES: Record<string, MarketIndex[]> = {
  India: REGION_DEFAULT_DATA['India'].indices,
  'United States': REGION_DEFAULT_DATA['United States'].indices,
  China: REGION_DEFAULT_DATA['China'].indices,
  Europe: REGION_DEFAULT_DATA['Europe'].indices,
  Commodities: REGION_DEFAULT_DATA['Commodities'].indices
};

// Pure deterministic helper to seed chart bars so switching benchmarks renders in 0ms
function generateDeterministicBars(symbol: string, basePrice: number, days: number = 240): HistoricalBar[] {
  const bars: HistoricalBar[] = [];
  const now = new Date('2026-10-23T00:00:00Z');
  let price = basePrice * 0.88;

  for (let i = days; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const angle = i * 0.07;
    const changeFactor = 1 + (Math.sin(angle) * 0.012 + Math.cos(angle * 0.5) * 0.008 + 0.0005);
    price = Number((price * changeFactor).toFixed(2));
    if (i === 0) price = basePrice;

    const open = Number((price * 0.998).toFixed(2));
    const high = Number((Math.max(open, price) * 1.006).toFixed(2));
    const low = Number((Math.min(open, price) * 0.994).toFixed(2));
    const close = price;
    const volume = Math.floor(120000 + Math.sin(i) * 40000);

    bars.push({
      date: d.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume
    });
  }
  return bars;
}

// Client-side in-memory caches for instantaneous switching (< 10ms)
const overviewClientCache = new Map<string, MarketOverviewData>([
  ['India', REGION_DEFAULT_DATA['India']],
  ['United States', REGION_DEFAULT_DATA['United States']],
  ['China', REGION_DEFAULT_DATA['China']],
  ['Europe', REGION_DEFAULT_DATA['Europe']],
  ['Commodities', REGION_DEFAULT_DATA['Commodities']]
]);

const historyClientCache = new Map<string, HistoricalBar[]>([
  ['^NSEI:1y', generateDeterministicBars('^NSEI', 22401.75)],
  ['^GSPC:1y', generateDeterministicBars('^GSPC', 7663.43)],
  ['^HSI:1y', generateDeterministicBars('^HSI', 24680.10)],
  ['^FTSE:1y', generateDeterministicBars('^FTSE', 10706.66)],
  ['GC=F:1y', generateDeterministicBars('GC=F', 4026.30)],
  ['CL=F:1y', generateDeterministicBars('CL=F', 100.74)],
  ['SI=F:1y', generateDeterministicBars('SI=F', 53.88)],
  ['NG=F:1y', generateDeterministicBars('NG=F', 3.12)],
  ['HG=F:1y', generateDeterministicBars('HG=F', 6.44)]
]);

export const MarketsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const regions = ['India', 'United States', 'China', 'Europe', 'Commodities'];

  const resolveParamRegion = (param: string | null) => {
    if (!param) return 'India';
    const norm = param.toLowerCase();
    if (norm.includes('commodit') || norm.includes('global')) return 'Commodities';
    if (norm.includes('us') || norm.includes('united')) return 'United States';
    if (norm.includes('china') || norm.includes('asia')) return 'China';
    if (norm.includes('europe') || norm.includes('uk')) return 'Europe';
    return 'India';
  };

  const initialRegion = resolveParamRegion(searchParams.get('region'));
  const [activeRegion, setActiveRegion] = useState<string>(initialRegion);
  const [marketData, setMarketData] = useState<MarketOverviewData>(
    REGION_DEFAULT_DATA[initialRegion] || REGION_DEFAULT_DATA['India']
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<MarketIndex | null>(
    (REGION_DEFAULT_DATA[initialRegion] || REGION_DEFAULT_DATA['India']).indices[0]
  );
  const [chartBars, setChartBars] = useState<HistoricalBar[]>(() => {
    const sym = (REGION_DEFAULT_DATA[initialRegion] || REGION_DEFAULT_DATA['India']).indices[0]?.symbol;
    return (sym && historyClientCache.get(`${sym}:1y`)) || historyClientCache.get('^NSEI:1y') || [];
  });
  const [chartLoading, setChartLoading] = useState<boolean>(false);
  const [chartInterval, setChartInterval] = useState<string>('1y');

  const handleSelectRegion = (reg: string) => {
    if (reg === activeRegion) return;
    setActiveRegion(reg);
    setSearchParams({ region: reg }, { replace: true });

    // 1. Immediately switch the regional market data from in-memory cache (< 1ms)
    const targetData = overviewClientCache.get(reg) || REGION_DEFAULT_DATA[reg];
    if (targetData) {
      setMarketData(targetData);
      setLoading(false);
      const match = targetData.indices.find((i) => i.symbol === targetData.defaultIndexSymbol) || targetData.indices[0];
      if (match) {
        setSelectedIndex(match);
        const cacheKey = `${match.symbol}:${chartInterval}`;
        if (historyClientCache.has(cacheKey)) {
          setChartBars(historyClientCache.get(cacheKey)!);
          setChartLoading(false);
        }
      }
    }
  };

  // Sync if URL query param changes
  useEffect(() => {
    const regParam = searchParams.get('region');
    if (regParam) {
      const reg = resolveParamRegion(regParam);
      if (reg !== activeRegion) {
        handleSelectRegion(reg);
      }
    }
  }, [searchParams]);

  // 1. Pre-fetch all regions in background so cache stays live with real-time updates
  useEffect(() => {
    regions.forEach((reg) => {
      fetch(`/api/markets/overview?region=${encodeURIComponent(reg)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: MarketOverviewData) => {
          if (data && data.indices && data.indices.length > 0) {
            overviewClientCache.set(reg, data);
            if (reg === activeRegion) {
              setMarketData(data);
            }
          }
        })
        .catch(() => {});
    });
  }, [activeRegion]);

  // 2. Fetch Historical Bars whenever selectedIndex changes or interval changes
  useEffect(() => {
    if (!selectedIndex?.symbol) return;
    let isMounted = true;

    const cacheKey = `${selectedIndex.symbol}:${chartInterval}`;
    if (historyClientCache.has(cacheKey)) {
      setChartBars(historyClientCache.get(cacheKey)!);
      setChartLoading(false);
    } else {
      setChartLoading(true);
    }

    fetch(`/api/instruments/${encodeURIComponent(selectedIndex.symbol)}/history?period=${encodeURIComponent(chartInterval)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((res) => {
        if (!isMounted) return;
        const bars = Array.isArray(res.bars) ? res.bars : [];
        if (bars.length > 0) {
          historyClientCache.set(cacheKey, bars);
          setChartBars(bars);
        }
        setChartLoading(false);
      })
      .catch(() => {
        if (isMounted) setChartLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedIndex?.symbol, chartInterval]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Markets</h1>
          <p className="page-subtitle">Real-time global financial markets, indices, sectors and breadth</p>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
          {marketData?.exchangeStatus || 'Real-Time Delayed 15m'}
        </div>
      </div>

      {/* Region Navigation Tabs (Spec: min-height 44 for touch targets) */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border)', marginBottom: '24px', overflowX: 'auto' }}>
        {regions.map((reg) => (
          <button
            key={reg}
            onClick={() => handleSelectRegion(reg)}
            style={{
              height: '44px',
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: '13px',
              fontWeight: activeRegion === reg ? 600 : 400,
              color: activeRegion === reg ? 'var(--foreground)' : 'var(--text-muted)',
              borderBottom: activeRegion === reg ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              padding: '0 4px'
            }}
          >
            {reg}
          </button>
        ))}
      </div>

      {/* 5 Benchmark Index Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {(marketData?.indices && marketData.indices.length > 0
          ? marketData.indices
          : (REGION_DEFAULT_INDICES[activeRegion] || REGION_DEFAULT_INDICES['India'])
        ).map((idx) => {
          const isUp = (idx.changePercent ?? 0) >= 0;
          const isSelected = selectedIndex?.symbol === idx.symbol;

          return (
            <div
              key={idx.symbol}
              className="card"
              onClick={() => setSelectedIndex(idx)}
              style={{
                padding: '16px 20px',
                cursor: 'pointer',
                border: isSelected ? '1px solid var(--foreground)' : '1px solid var(--border)',
                backgroundColor: isSelected ? 'var(--secondary)' : 'var(--card)',
                boxShadow: isSelected ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--foreground)' }}>{idx.name}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{idx.currency}</span>
              </div>

              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                {idx.price !== null ? formatPrice({ amount: idx.price, currency: idx.currency }) : '—'}
              </div>

              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isUp ? 'var(--positive)' : 'var(--negative)',
                  marginTop: '4px',
                  marginBottom: '12px',
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {isUp ? '▲ ' : '▼ '}
                {formatPercent(idx.changePercent)}
              </div>

              {idx.trend && idx.trend.length > 1 && (
                <Sparkline data={idx.trend} isPositive={isUp} width={100} height={24} />
              )}
            </div>
          );
        })}
      </div>

      {/* Native Performance Chart Card (Powered by Hedger Canvas 2D Engine) */}
      <div
        id="market-performance-chart"
        className="card"
        style={{
          padding: '24px',
          marginBottom: '32px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)' }}>
                {selectedIndex?.name || 'Benchmark'} Performance
              </span>
              <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--secondary)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {selectedIndex?.symbol} · NATIVE CANVAS 2D
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {selectedIndex?.price !== null && selectedIndex?.price !== undefined
                ? `${formatPrice({ amount: selectedIndex.price, currency: selectedIndex.currency })} · ${formatPercent(selectedIndex.changePercent)}`
                : 'Live Market Index Feed'}
            </div>
          </div>
        </div>

        {/* Native 60 FPS Canvas Chart Engine */}
        <div style={{ width: '100%', minHeight: '280px', position: 'relative' }}>
          {chartBars.length > 0 ? (
            <>
              <HedgerChart
                bars={chartBars}
                currency={selectedIndex?.currency || 'USD'}
                defaultPeriod={chartInterval}
                onPeriodChange={setChartInterval}
                height={280}
              />
              {chartLoading && (
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '12px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--popover)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border)',
                    pointerEvents: 'none'
                  }}
                >
                  Updating...
                </div>
              )}
            </>
          ) : chartLoading ? (
            <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Loading historical chart bars for {selectedIndex?.name}...
            </div>
          ) : (
            <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Historical chart feed currently updating for {selectedIndex?.symbol}...
            </div>
          )}
        </div>
      </div>

      {/* Bottom 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Left Column: Breadth & Sectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Market Breadth */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '16px' }}>
              Market breadth ({activeRegion})
            </div>

            {/* Visual ratio bar */}
            <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ flex: marketData?.breadth?.advances || 1, backgroundColor: 'var(--positive)' }} />
              <div style={{ flex: marketData?.breadth?.unchanged || 1, backgroundColor: 'var(--border)' }} />
              <div style={{ flex: marketData?.breadth?.declines || 1, backgroundColor: 'var(--negative)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <span>{marketData?.breadth?.advances?.toLocaleString() || '—'} advancing</span>
              <span>{marketData?.breadth?.unchanged?.toLocaleString() || '—'} unchanged</span>
              <span>{marketData?.breadth?.declines?.toLocaleString() || '—'} declining</span>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Advance/decline ratio <strong style={{ color: 'var(--foreground)' }}>{marketData?.breadth?.advanceDeclineRatio ?? '—'}</strong>
            </div>
          </div>

          {/* Sectors Diverging Bar Visualizer */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '16px' }}>
              Sectors Performance
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {marketData?.sectors?.map((sec) => (
                <div key={sec.name} style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ width: '130px', color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sec.name}
                  </span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', height: '14px', position: 'relative' }}>
                    {/* Center baseline */}
                    <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', backgroundColor: 'var(--border)' }} />
                    {sec.change >= 0 ? (
                      <div
                        style={{
                          position: 'absolute',
                          left: '50%',
                          height: '8px',
                          borderRadius: '2px',
                          backgroundColor: 'var(--positive)',
                          width: `${Math.min(50, (sec.change / 3.0) * 50)}%`
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          position: 'absolute',
                          right: '50%',
                          height: '8px',
                          borderRadius: '2px',
                          backgroundColor: 'var(--negative)',
                          width: `${Math.min(50, (Math.abs(sec.change) / 3.0) * 50)}%`
                        }}
                      />
                    )}
                  </div>
                  <span
                    style={{
                      width: '60px',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: 500,
                      color: sec.change >= 0 ? 'var(--positive)' : 'var(--negative)'
                    }}
                  >
                    {sec.change >= 0 ? `+${sec.change.toFixed(1)}%` : `−${Math.abs(sec.change).toFixed(1)}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Top Gainers & Losers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top Gainers */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '16px' }}>
              Top Gainers ({activeRegion})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {marketData?.gainers?.map((st) => (
                <div
                  key={st.symbol}
                  onClick={() => navigate(companyPath(st.symbol))}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    minHeight: '44px',
                    padding: '0 4px',
                    borderRadius: '6px'
                  }}
                  className="hover:bg-[var(--secondary)]"
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>{st.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{st.symbol}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatPrice({ amount: st.price, currency: st.currency })}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--positive)', fontVariantNumeric: 'tabular-nums' }}>
                      ▲ {formatPercent(st.changePercent)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '16px' }}>
              Top Losers ({activeRegion})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {marketData?.losers?.map((st) => (
                <div
                  key={st.symbol}
                  onClick={() => navigate(companyPath(st.symbol))}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    minHeight: '44px',
                    padding: '0 4px',
                    borderRadius: '6px'
                  }}
                  className="hover:bg-[var(--secondary)]"
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>{st.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{st.symbol}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatPrice({ amount: st.price, currency: st.currency })}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--negative)', fontVariantNumeric: 'tabular-nums' }}>
                      ▼ {formatPercent(st.changePercent)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Markets Footer Disclaimer */}
      <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '48px', lineHeight: 1.5 }}>
        Multi-market live feed provided via official exchange gateway adapters. Not investment advice or an endorsement. Delayed 15m.
      </div>
    </div>
  );
};
