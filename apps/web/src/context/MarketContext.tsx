import React, { createContext, useContext, useState, useEffect } from 'react';

export type MarketId = 'us' | 'in' | 'eu' | 'asia' | 'all';

export interface QuickTicker {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  price?: number;
  change?: string;
  isPositive?: boolean;
}

export interface MarketInfo {
  id: MarketId;
  name: string;
  shortName: string;
  code: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  primaryIndex: string;
  primaryIndexValue: string;
  primaryIndexChange: string;
  isPositive: boolean;
  status: string;
  isOpen: boolean;
  exchanges: string[];
  quickTickers: QuickTicker[];
}

export const MARKETS_DATA: Record<MarketId, MarketInfo> = {
  us: {
    id: 'us',
    name: 'United States',
    shortName: 'US Market',
    code: 'US',
    flag: '',
    currency: 'USD',
    currencySymbol: '$',
    primaryIndex: 'S&P 500',
    primaryIndexValue: '5,864.67',
    primaryIndexChange: '+24.50 (+0.42%)',
    isPositive: true,
    status: 'Market Open · Regular Hours',
    isOpen: true,
    exchanges: ['NASDAQ', 'NYSE', 'AMEX'],
    quickTickers: [
      { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', currency: 'USD', price: 210.96, change: '+2.4%', isPositive: true },
      { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', currency: 'USD', price: 348.22, change: '+1.4%', isPositive: true },
      { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', currency: 'USD', price: 521.08, change: '+1.2%', isPositive: true },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', currency: 'USD', price: 214.30, change: '+0.8%', isPositive: true },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', currency: 'USD', price: 184.50, change: '+0.5%', isPositive: true },
      { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', currency: 'USD', price: 612.40, change: '+1.9%', isPositive: true }
    ]
  },
  in: {
    id: 'in',
    name: 'India',
    shortName: 'Indian Market',
    code: 'IN',
    flag: '',
    currency: 'INR',
    currencySymbol: '₹',
    primaryIndex: 'NIFTY 50',
    primaryIndexValue: '24,850.30',
    primaryIndexChange: '+161.50 (+0.65%)',
    isPositive: true,
    status: 'Market Closed · IST Session Ended',
    isOpen: false,
    exchanges: ['NSE', 'BSE'],
    quickTickers: [
      { symbol: 'RELIANCE.NS', name: 'Reliance Industries', exchange: 'NSE', currency: 'INR', price: 1173.0, change: '+0.87%', isPositive: true },
      { symbol: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE', currency: 'INR', price: 2535.5, change: '-0.45%', isPositive: false },
      { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', exchange: 'NSE', currency: 'INR', price: 1742.0, change: '+0.86%', isPositive: true },
      { symbol: 'INFY.NS', name: 'Infosys Limited', exchange: 'NSE', currency: 'INR', price: 1890.4, change: '+0.32%', isPositive: true },
      { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Limited', exchange: 'NSE', currency: 'INR', price: 1245.8, change: '+1.10%', isPositive: true },
      { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Limited', exchange: 'NSE', currency: 'INR', price: 1680.2, change: '+0.45%', isPositive: true }
    ]
  },
  eu: {
    id: 'eu',
    name: 'Europe & UK',
    shortName: 'European Market',
    code: 'EU',
    flag: '',
    currency: 'EUR',
    currencySymbol: '€',
    primaryIndex: 'FTSE 100',
    primaryIndexValue: '8,245.10',
    primaryIndexChange: '-10.20 (-0.12%)',
    isPositive: false,
    status: 'Market Closed · BST / CET Session Ended',
    isOpen: false,
    exchanges: ['LSE', 'XETRA', 'EURONEXT'],
    quickTickers: [
      { symbol: 'ASML', name: 'ASML Holding N.V.', exchange: 'EURONEXT', currency: 'EUR', price: 712.5, change: '+1.6%', isPositive: true },
      { symbol: 'SAP', name: 'SAP SE', exchange: 'XETRA', currency: 'EUR', price: 215.4, change: '+0.7%', isPositive: true },
      { symbol: 'SHEL', name: 'Shell plc', exchange: 'LSE', currency: 'GBP', price: 2640.0, change: '-0.3%', isPositive: false },
      { symbol: 'AZN', name: 'AstraZeneca PLC', exchange: 'LSE', currency: 'GBP', price: 11840.0, change: '+0.4%', isPositive: true }
    ]
  },
  asia: {
    id: 'asia',
    name: 'Asia-Pacific',
    shortName: 'Asian Markets',
    code: 'APAC',
    flag: '',
    currency: 'JPY',
    currencySymbol: '¥',
    primaryIndex: 'Nikkei 225',
    primaryIndexValue: '38,981.75',
    primaryIndexChange: '+70.40 (+0.18%)',
    isPositive: true,
    status: 'Market Closed · JST Session Ended',
    isOpen: false,
    exchanges: ['TSE', 'HKEX', 'SGX'],
    quickTickers: [
      { symbol: '7203.T', name: 'Toyota Motor Corporation', exchange: 'TSE', currency: 'JPY', price: 2740.0, change: '+0.9%', isPositive: true },
      { symbol: '9984.T', name: 'SoftBank Group Corp.', exchange: 'TSE', currency: 'JPY', price: 8950.0, change: '+1.8%', isPositive: true },
      { symbol: '9988.HK', name: 'Alibaba Group Holding', exchange: 'HKEX', currency: 'HKD', price: 98.4, change: '+2.1%', isPositive: true }
    ]
  },
  all: {
    id: 'all',
    name: 'Global Markets',
    shortName: 'All Markets',
    code: 'GLOBAL',
    flag: '',
    currency: 'USD',
    currencySymbol: '$',
    primaryIndex: 'MSCI World',
    primaryIndexValue: '3,720.40',
    primaryIndexChange: '+12.90 (+0.35%)',
    isPositive: true,
    status: 'Continuous Cross-Border Feeds',
    isOpen: true,
    exchanges: ['All Major Global Exchanges'],
    quickTickers: [
      { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', currency: 'USD', price: 210.96, change: '+2.4%', isPositive: true },
      { symbol: 'RELIANCE.NS', name: 'Reliance Industries', exchange: 'NSE', currency: 'INR', price: 1173.0, change: '+0.87%', isPositive: true },
      { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', currency: 'USD', price: 348.22, change: '+1.4%', isPositive: true },
      { symbol: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE', currency: 'INR', price: 2535.5, change: '-0.45%', isPositive: false },
      { symbol: 'ASML', name: 'ASML Holding N.V.', exchange: 'EURONEXT', currency: 'EUR', price: 712.5, change: '+1.6%', isPositive: true }
    ]
  }
};

export interface MarketContextType {
  activeMarket: MarketId;
  setActiveMarket: (market: MarketId) => void;
  marketConfig: MarketInfo;
  allMarkets: MarketInfo[];
  filterInstruments: <T extends { symbol: string; country?: string; currency?: string; exchange?: string; region?: string }>(items: T[]) => T[];
  isInstrumentInActiveMarket: (item: { symbol: string; country?: string; currency?: string; exchange?: string; region?: string }) => boolean;
  getDefaultComparisonPair: (market?: MarketId) => { a: string; b: string; targetCurrency: 'INR' | 'USD' | 'EUR' | 'GBP' };
  getMarketRegion: (market?: MarketId) => string;
}

export function getDefaultComparisonPair(market: MarketId = 'us'): { a: string; b: string; targetCurrency: 'INR' | 'USD' | 'EUR' | 'GBP' } {
  if (market === 'in') {
    return { a: 'TCS.NS', b: 'INFY.NS', targetCurrency: 'INR' };
  }
  if (market === 'eu') {
    return { a: 'ASML.AS', b: 'SAP.DE', targetCurrency: 'EUR' };
  }
  if (market === 'asia') {
    return { a: '7203.T', b: '9984.T', targetCurrency: 'USD' };
  }
  return { a: 'NVDA', b: 'AAPL', targetCurrency: 'USD' };
}

export function getMarketRegion(market: MarketId = 'us'): string {
  if (market === 'in') return 'india';
  if (market === 'eu') return 'europe';
  if (market === 'asia') return 'asia';
  if (market === 'all') return 'all';
  return 'us';
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

const STORAGE_KEY = 'hedger_selected_market';

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMarket, setActiveMarketState] = useState<MarketId>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === 'us' || stored === 'in' || stored === 'eu' || stored === 'asia' || stored === 'all')) {
        return stored as MarketId;
      }
    } catch {
      // LocalStorage fallback
    }
    return 'all'; // Default to Global Markets so all markets can be screened initially
  });

  const setActiveMarket = (market: MarketId) => {
    setActiveMarketState(market);
    try {
      localStorage.setItem(STORAGE_KEY, market);
    } catch {
      // Ignore
    }
  };

  const isInstrumentInActiveMarket = (item: {
    symbol: string;
    country?: string;
    currency?: string;
    exchange?: string;
    region?: string;
  }): boolean => {
    if (activeMarket === 'all') return true;

    // Direct region tag check if available
    if (item.region) {
      const reg = item.region.toLowerCase();
      if (activeMarket === 'in') return reg === 'india' || reg === 'in';
      if (activeMarket === 'us') return reg === 'us' || reg === 'usa';
      if (activeMarket === 'eu') return reg === 'europe' || reg === 'eu';
      if (activeMarket === 'asia') return reg === 'asia';
    }

    const sym = item.symbol.toUpperCase();
    const ctry = (item.country || '').toUpperCase();
    const curr = (item.currency || '').toUpperCase();
    const exch = (item.exchange || '').toUpperCase();

    if (activeMarket === 'in') {
      return (
        sym.endsWith('.NS') ||
        sym.endsWith('.BO') ||
        sym === '^NSEI' ||
        sym === '^BSESN' ||
        ctry === 'INDIA' ||
        curr === 'INR' ||
        exch === 'NSE' ||
        exch === 'BSE'
      );
    }

    if (activeMarket === 'us') {
      // Exclude foreign suffixes
      if (
        sym.endsWith('.NS') ||
        sym.endsWith('.BO') ||
        sym.endsWith('.L') ||
        sym.endsWith('.DE') ||
        sym.endsWith('.PA') ||
        sym.endsWith('.AS') ||
        sym.endsWith('.SW') ||
        sym.endsWith('.T') ||
        sym.endsWith('.HK') ||
        sym.endsWith('.SZ') ||
        sym.endsWith('.SS')
      ) {
        return false;
      }
      if (ctry === 'INDIA' || curr === 'INR' || ctry === 'EUROPE' || ctry === 'UK' || curr === 'EUR' || curr === 'GBP' || curr === 'JPY' || curr === 'HKD') {
        return false;
      }
      return (
        ctry === 'US' ||
        ctry === 'UNITED STATES' ||
        curr === 'USD' ||
        exch === 'NASDAQ' ||
        exch === 'NYSE' ||
        exch === 'AMEX' ||
        exch === 'BATS' ||
        !sym.includes('.')
      );
    }

    if (activeMarket === 'eu') {
      return (
        ctry === 'EUROPE' ||
        ctry === 'UK' ||
        ctry === 'GERMANY' ||
        ctry === 'FRANCE' ||
        ctry === 'SWITZERLAND' ||
        ctry === 'NETHERLANDS' ||
        curr === 'EUR' ||
        curr === 'GBP' ||
        curr === 'CHF' ||
        sym.endsWith('.L') ||
        sym.endsWith('.DE') ||
        sym.endsWith('.PA') ||
        sym.endsWith('.AS') ||
        sym.endsWith('.SW') ||
        exch === 'LSE' ||
        exch === 'XETRA' ||
        exch === 'EURONEXT'
      );
    }

    if (activeMarket === 'asia') {
      return (
        ctry === 'ASIA' ||
        ctry === 'JAPAN' ||
        ctry === 'CHINA' ||
        ctry === 'HONG KONG' ||
        curr === 'JPY' ||
        curr === 'HKD' ||
        curr === 'CNY' ||
        sym.endsWith('.T') ||
        sym.endsWith('.HK') ||
        sym.endsWith('.SZ') ||
        sym.endsWith('.SS') ||
        exch === 'TSE' ||
        exch === 'HKEX' ||
        exch === 'SGX'
      );
    }

    return true;
  };

  const filterInstruments = <T extends { symbol: string; country?: string; currency?: string; exchange?: string; region?: string }>(
    items: T[]
  ): T[] => {
    return items.filter(isInstrumentInActiveMarket);
  };

  const marketConfig = MARKETS_DATA[activeMarket];
  const allMarkets = [
    MARKETS_DATA.us,
    MARKETS_DATA.in,
    MARKETS_DATA.eu,
    MARKETS_DATA.asia,
    MARKETS_DATA.all
  ];

  return (
    <MarketContext.Provider
      value={{
        activeMarket,
        setActiveMarket,
        marketConfig,
        allMarkets,
        filterInstruments,
        isInstrumentInActiveMarket,
        getDefaultComparisonPair,
        getMarketRegion
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = (): MarketContextType => {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
};
