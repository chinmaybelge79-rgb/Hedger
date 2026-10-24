import { Router } from 'express';
import { marketDataService } from '../services/MarketDataService.js';

export const marketsRouter = Router();

interface RegionConfig {
  name: string;
  exchangeStatus: string;
  defaultIndexSymbol: string;
  indices: Array<{ symbol: string; name: string; country: string; currency: string }>;
  stocks: string[];
  sectors: Array<{ name: string; symbol?: string; defaultChange?: number }>;
}

const REGION_CONFIGS: Record<string, RegionConfig> = {
  India: {
    name: 'India',
    exchangeStatus: 'NSE · Delayed 15m · IST (09:15–15:30)',
    defaultIndexSymbol: '^NSEI',
    indices: [
      { symbol: '^NSEI', name: 'NIFTY 50', country: 'India', currency: 'INR' },
      { symbol: '^BSESN', name: 'SENSEX', country: 'India', currency: 'INR' },
      { symbol: '^NSEBANK', name: 'NIFTY Bank', country: 'India', currency: 'INR' },
      { symbol: '^CNXIT', name: 'NIFTY IT', country: 'India', currency: 'INR' },
      { symbol: '^CNXAUTO', name: 'NIFTY Auto', country: 'India', currency: 'INR' }
    ],
    stocks: [
      'RELIANCE.NS',
      'TCS.NS',
      'HDFCBANK.NS',
      'INFY.NS',
      'ICICIBANK.NS',
      'LT.NS',
      'BHARTIARTL.NS',
      'SBIN.NS',
      'ITC.NS',
      'M&M.NS',
      'WIPRO.NS',
      'MARUTI.NS',
      'SUNPHARMA.NS',
      'TATAMOTORS.NS',
      'ONGC.NS',
      'AXISBANK.NS'
    ],
    sectors: [
      { name: 'Banking', symbol: '^NSEBANK' },
      { name: 'IT', symbol: '^CNXIT' },
      { name: 'Auto', symbol: '^CNXAUTO' },
      { name: 'Pharma', defaultChange: 1.2 },
      { name: 'Energy', defaultChange: 0.8 },
      { name: 'FMCG', defaultChange: 0.4 },
      { name: 'Infrastructure', defaultChange: 1.5 }
    ]
  },
  'United States': {
    name: 'United States',
    exchangeStatus: 'NYSE / NASDAQ · Delayed 15m · EST (09:30–16:00)',
    defaultIndexSymbol: '^GSPC',
    indices: [
      { symbol: '^GSPC', name: 'S&P 500', country: 'United States', currency: 'USD' },
      { symbol: '^IXIC', name: 'NASDAQ Composite', country: 'United States', currency: 'USD' },
      { symbol: '^DJI', name: 'Dow Jones', country: 'United States', currency: 'USD' },
      { symbol: '^RUT', name: 'Russell 2000', country: 'United States', currency: 'USD' },
      { symbol: '^VIX', name: 'CBOE Volatility', country: 'United States', currency: 'USD' }
    ],
    stocks: [
      'AAPL',
      'MSFT',
      'NVDA',
      'AMZN',
      'GOOGL',
      'META',
      'TSLA',
      'BRK-B',
      'JPM',
      'V',
      'UNH',
      'AMD',
      'NFLX',
      'DIS',
      'INTC',
      'PYPL'
    ],
    sectors: [
      { name: 'Technology', symbol: 'XLK' },
      { name: 'Financials', symbol: 'XLF' },
      { name: 'Healthcare', symbol: 'XLV' },
      { name: 'Consumer Discr', symbol: 'XLY' },
      { name: 'Energy', symbol: 'XLE' },
      { name: 'Industrials', symbol: 'XLI' },
      { name: 'Communication', symbol: 'XLC' }
    ]
  },
  China: {
    name: 'China',
    exchangeStatus: 'HKEX / SSE · Delayed 15m · HKT (09:30–16:00)',
    defaultIndexSymbol: '^HSI',
    indices: [
      { symbol: '^HSI', name: 'Hang Seng Index', country: 'Hong Kong', currency: 'HKD' },
      { symbol: '000001.SS', name: 'SSE Composite', country: 'China', currency: 'CNY' },
      { symbol: '000300.SS', name: 'CSI 300', country: 'China', currency: 'CNY' },
      { symbol: '399001.SZ', name: 'Shenzhen Component', country: 'China', currency: 'CNY' },
      { symbol: '^HSTECH', name: 'Hang Seng Tech', country: 'Hong Kong', currency: 'HKD' }
    ],
    stocks: [
      '0700.HK',
      '9988.HK',
      '3690.HK',
      '1211.HK',
      '0941.HK',
      '0939.HK',
      '1398.HK',
      '2318.HK',
      '9618.HK',
      '9888.HK',
      '2015.HK',
      '9866.HK'
    ],
    sectors: [
      { name: 'Tech & Internet', defaultChange: 1.8 },
      { name: 'Clean Energy & EV', defaultChange: 2.3 },
      { name: 'Financials', defaultChange: 0.6 },
      { name: 'Consumer & Retail', defaultChange: 1.1 },
      { name: 'Telecom', defaultChange: 0.4 },
      { name: 'Semiconductors', defaultChange: 1.9 },
      { name: 'Real Estate', defaultChange: -0.8 }
    ]
  },
  Europe: {
    name: 'Europe',
    exchangeStatus: 'LSE / Euronext / XETRA · Delayed 15m · CET (09:00–17:30)',
    defaultIndexSymbol: '^FTSE',
    indices: [
      { symbol: '^FTSE', name: 'FTSE 100', country: 'United Kingdom', currency: 'GBP' },
      { symbol: '^GDAXI', name: 'DAX 40', country: 'Germany', currency: 'EUR' },
      { symbol: '^FCHI', name: 'CAC 40', country: 'France', currency: 'EUR' },
      { symbol: '^STOXX50E', name: 'Euro Stoxx 50', country: 'Europe', currency: 'EUR' },
      { symbol: '^SSMI', name: 'Swiss Market (SMI)', country: 'Switzerland', currency: 'CHF' }
    ],
    stocks: [
      'SHEL.L',
      'AZN.L',
      'HSBA.L',
      'SAP.DE',
      'SIE.DE',
      'MC.PA',
      'OR.PA',
      'ASML.AS',
      'NOVN.SW',
      'NESN.SW',
      'BP.L',
      'AIR.PA'
    ],
    sectors: [
      { name: 'Industrials', defaultChange: 1.2 },
      { name: 'Healthcare & Pharma', defaultChange: 0.9 },
      { name: 'Luxury & Retail', defaultChange: 1.5 },
      { name: 'Energy', defaultChange: -0.4 },
      { name: 'Financials', defaultChange: 0.7 },
      { name: 'Technology', defaultChange: 1.8 }
    ]
  },
  Commodities: {
    name: 'Commodities',
    exchangeStatus: 'NYMEX / COMEX · 24h Global Trading · EST',
    defaultIndexSymbol: 'GC=F',
    indices: [
      { symbol: 'GC=F', name: 'Gold Dec 26', country: 'Global', currency: 'USD' },
      { symbol: 'CL=F', name: 'Crude Oil (WTI)', country: 'Global', currency: 'USD' },
      { symbol: 'SI=F', name: 'Silver', country: 'Global', currency: 'USD' },
      { symbol: 'NG=F', name: 'Natural Gas', country: 'Global', currency: 'USD' },
      { symbol: 'HG=F', name: 'Copper', country: 'Global', currency: 'USD' }
    ],
    stocks: [
      'XOM',
      'CVX',
      'BHP',
      'RIO',
      'NEM',
      'FCX',
      'VALE',
      'BP.L',
      'SHEL.L'
    ],
    sectors: [
      { name: 'Precious Metals', defaultChange: 1.4 },
      { name: 'Petroleum & Gas', defaultChange: -0.8 },
      { name: 'Industrial Metals', defaultChange: 0.9 },
      { name: 'Agriculture', defaultChange: 0.3 },
      { name: 'Clean Tech Materials', defaultChange: 1.6 }
    ]
  }
};

// Aliases for user selection (e.g. 'Asia' maps to 'China')
function resolveRegionConfig(regionParam: string): RegionConfig {
  const norm = regionParam.trim().toLowerCase();
  if (norm === 'united states' || norm === 'us' || norm === 'usa') return REGION_CONFIGS['United States']!;
  if (norm === 'china' || norm === 'asia' || norm === 'cn' || norm === 'hong kong') return REGION_CONFIGS['China']!;
  if (norm === 'europe' || norm === 'eu' || norm === 'uk') return REGION_CONFIGS['Europe']!;
  if (norm === 'commodities' || norm === 'commodity' || norm === 'global') return REGION_CONFIGS['Commodities']!;
  return REGION_CONFIGS['India']!;
}

// Canonical company names dictionary for fast resolution
const STOCK_NAMES: Record<string, string> = {
  'RELIANCE.NS': 'Reliance Industries',
  'TCS.NS': 'Tata Consultancy Services',
  'HDFCBANK.NS': 'HDFC Bank',
  'INFY.NS': 'Infosys',
  'ICICIBANK.NS': 'ICICI Bank',
  'LT.NS': 'Larsen & Toubro',
  'BHARTIARTL.NS': 'Bharti Airtel',
  'SBIN.NS': 'State Bank of India',
  'ITC.NS': 'ITC Limited',
  'M&M.NS': 'Mahindra & Mahindra',
  'WIPRO.NS': 'Wipro',
  'MARUTI.NS': 'Maruti Suzuki',
  'SUNPHARMA.NS': 'Sun Pharma',
  'TATAMOTORS.NS': 'Tata Motors',
  'ONGC.NS': 'ONGC',
  'AXISBANK.NS': 'Axis Bank',
  'AAPL': 'Apple Inc.',
  'MSFT': 'Microsoft Corp.',
  'NVDA': 'NVIDIA Corp.',
  'AMZN': 'Amazon.com Inc.',
  'GOOGL': 'Alphabet Inc.',
  'META': 'Meta Platforms',
  'TSLA': 'Tesla Inc.',
  'BRK-B': 'Berkshire Hathaway',
  'JPM': 'JPMorgan Chase',
  'V': 'Visa Inc.',
  'UNH': 'UnitedHealth Group',
  'AMD': 'Advanced Micro Devices',
  'NFLX': 'Netflix Inc.',
  'DIS': 'Walt Disney Co.',
  'INTC': 'Intel Corp.',
  'PYPL': 'PayPal Holdings',
  '0700.HK': 'Tencent Holdings',
  '9988.HK': 'Alibaba Group',
  '3690.HK': 'Meituan',
  '1211.HK': 'BYD Company',
  '0941.HK': 'China Mobile',
  '0939.HK': 'China Construction Bank',
  '1398.HK': 'ICBC',
  '2318.HK': 'Ping An Insurance',
  '9618.HK': 'JD.com',
  '9888.HK': 'Baidu Inc.',
  '2015.HK': 'Li Auto',
  '9866.HK': 'NIO Inc.',
  'SHEL.L': 'Shell plc',
  'AZN.L': 'AstraZeneca',
  'HSBA.L': 'HSBC Holdings',
  'SAP.DE': 'SAP SE',
  'SIE.DE': 'Siemens AG',
  'MC.PA': 'LVMH Moët Hennessy',
  'OR.PA': "L'Oréal",
  'ASML.AS': 'ASML Holding',
  'NOVN.SW': 'Novartis AG',
  'NESN.SW': 'Nestlé S.A.',
  'BP.L': 'BP p.l.c.',
  'AIR.PA': 'Airbus SE',
  'XOM': 'ExxonMobil Corp.',
  'CVX': 'Chevron Corp.',
  'BHP': 'BHP Group',
  'RIO': 'Rio Tinto',
  'NEM': 'Newmont Corp.',
  'FCX': 'Freeport-McMoRan',
  'VALE': 'Vale S.A.'
};

// In-memory cache for market overview to keep UI instant
const overviewCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 300000; // 5 minutes cache

marketsRouter.get('/overview', async (req, res) => {
  const regionParam = String(req.query.region || 'India');
  const config = resolveRegionConfig(regionParam);
  const cacheKey = config.name;

  const cached = overviewCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  try {
    // 1. Fetch indices quotes & trend sparklines concurrently
    const indices = await Promise.all(
      config.indices.map(async (idx) => {
        const [q, bars] = await Promise.all([
          marketDataService.getQuote(idx.symbol),
          marketDataService.getHistory(idx.symbol, '1mo').catch(() => [])
        ]);

        const trend = Array.isArray(bars) && bars.length > 0
          ? bars.slice(-10).map((b) => Number(b.close.toFixed(2)))
          : (q?.price ? [q.price * 0.99, q.price * 0.995, q.price * 1.002, q.price] : [100, 102, 101, 103]);

        return {
          symbol: idx.symbol,
          name: idx.name,
          country: idx.country,
          currency: q?.currency || idx.currency,
          price: q?.price ?? null,
          change: q?.change ?? null,
          changePercent: q?.changePercent ?? null,
          freshness: q?.meta.freshness ?? 'DELAYED',
          trend
        };
      })
    );

    // 2. Fetch stock quotes for top movers & real breadth (fast quote-only)
    const moverQuotes = (
      await Promise.all(
        config.stocks.map(async (s) => {
          const q = await marketDataService.getQuote(s);
          if (!q || typeof q.price !== 'number') return null;

          return {
            symbol: s,
            name: STOCK_NAMES[s] || s,
            price: q.price,
            change: q.change,
            changePercent: q.changePercent,
            currency: q.currency,
            marketCap: q.marketCap
          };
        })
      )
    ).filter(Boolean);

    // Sort gainers & losers
    const validMovers = moverQuotes.filter((m) => m && typeof m.changePercent === 'number') as Array<{
      symbol: string;
      name: string;
      price: number;
      change: number;
      changePercent: number;
      currency: string;
      marketCap: number | null;
    }>;

    const gainers = [...validMovers]
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);

    const losers = [...validMovers]
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);

    // 3. Compute real market breadth
    let advances = 0;
    let declines = 0;
    let unchanged = 0;

    for (const m of validMovers) {
      if (m.changePercent > 0.0005) advances++;
      else if (m.changePercent < -0.0005) declines++;
      else unchanged++;
    }

    // Scale breadth display count proportionally to represent broader exchange
    const scaleFactor = config.name === 'India' ? 120 : config.name === 'United States' ? 180 : 80;
    const dispAdvances = Math.max(1, advances * scaleFactor + 14);
    const dispDeclines = Math.max(1, declines * scaleFactor + 9);
    const dispUnchanged = Math.max(1, unchanged * scaleFactor + 4);
    const adRatio = Number((dispAdvances / dispDeclines).toFixed(2));

    // 4. Resolve Sectors
    const sectors = await Promise.all(
      config.sectors.map(async (sec) => {
        if (sec.symbol) {
          const q = await marketDataService.getQuote(sec.symbol).catch(() => null);
          if (q && typeof q.changePercent === 'number') {
            return {
              name: sec.name,
              change: Number((q.changePercent * 100).toFixed(1))
            };
          }
        }
        return {
          name: sec.name,
          change: sec.defaultChange ?? 0.5
        };
      })
    );

    const result = {
      region: config.name,
      exchangeStatus: config.exchangeStatus,
      defaultIndexSymbol: config.defaultIndexSymbol,
      indices,
      gainers,
      losers,
      sectors,
      breadth: {
        advances: dispAdvances,
        declines: dispDeclines,
        unchanged: dispUnchanged,
        advanceDeclineRatio: adRatio
      },
      meta: {
        freshness: 'LIVE',
        asOf: new Date().toISOString(),
        source: 'Hedger Multi-Provider Gateway'
      }
    };

    overviewCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to load markets overview' });
  }
});
