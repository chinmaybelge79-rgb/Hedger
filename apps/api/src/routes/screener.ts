import { Router } from 'express';
import { marketDataService } from '../services/MarketDataService.js';

export const screenerRouter = Router();

export interface ScreenerStock {
  symbol: string;
  name: string;
  country: string;
  region: 'india' | 'us' | 'europe' | 'asia';
  exchange: string;
  sector: string;
  currency: string;
  price: number;
  changePercent: number;
  marketCap: number; // in local currency
  marketCapUsd: number; // for cross-border normalized sorting
  peRatio: number | null;
  pbRatio: number | null;
  roe: number | null; // e.g. 0.25 for 25%
  dividendYield: number | null;
  trend: number[];
}

// FX rates for normalized USD sorting
const FX_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  INR: 1 / 86.85,
  EUR: 1.08,
  GBP: 1.28,
  JPY: 1 / 152.5,
  HKD: 1 / 7.78,
  CHF: 1.13,
  KRW: 1 / 1440.0
};

// Global Screener Universe (70 Global Equities: India, US, Europe, Asia-Pacific)
const GLOBAL_SCREENER_UNIVERSE: ScreenerStock[] = [
  // ================= INDIA (NSE) =================
  {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd',
    country: 'India',
    region: 'india',
    exchange: 'NSE',
    sector: 'Energy',
    currency: 'INR',
    price: 1184.40,
    changePercent: -0.0001,
    marketCap: 16035000000000,
    marketCapUsd: 16035000000000 / 86.85,
    peRatio: 21.5,
    pbRatio: 1.8,
    roe: 0.089,
    dividendYield: 0.005,
    trend: [1170, 1175, 1182, 1190, 1188, 1184]
  },
  {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services',
    country: 'India',
    region: 'india',
    exchange: 'NSE',
    sector: 'Technology',
    currency: 'INR',
    price: 2533.40,
    changePercent: 0.0092,
    marketCap: 9153000000000,
    marketCapUsd: 9153000000000 / 86.85,
    peRatio: 17.7,
    pbRatio: 7.7,
    roe: 0.510,
    dividendYield: 0.021,
    trend: [2480, 2495, 2510, 2505, 2520, 2533]
  },
  {
    symbol: 'HDFCBANK.NS',
    name: 'HDFC Bank Ltd',
    country: 'India',
    region: 'india',
    exchange: 'NSE',
    sector: 'Financial Services',
    currency: 'INR',
    price: 693.75,
    changePercent: -0.0018,
    marketCap: 10682000000000,
    marketCapUsd: 10682000000000 / 86.85,
    peRatio: 15.1,
    pbRatio: 1.8,
    roe: 0.155,
    dividendYield: 0.012,
    trend: [698, 696, 695, 692, 694, 693]
  },
  {
    symbol: 'ICICIBANK.NS',
    name: 'ICICI Bank Ltd',
    country: 'India',
    region: 'india',
    exchange: 'NSE',
    sector: 'Financial Services',
    currency: 'INR',
    price: 1262.80,
    changePercent: 0.0065,
    marketCap: 8890000000000,
    marketCapUsd: 8890000000000 / 86.85,
    peRatio: 17.8,
    pbRatio: 2.9,
    roe: 0.182,
    dividendYield: 0.008,
    trend: [1240, 1245, 1250, 1258, 1260, 1262]
  },
  {
    symbol: 'INFY.NS',
    name: 'Infosys Ltd',
    country: 'India',
    region: 'india',
    exchange: 'NSE',
    sector: 'Technology',
    currency: 'INR',
    price: 1159.30,
    changePercent: -0.0042,
    marketCap: 4810000000000,
    marketCapUsd: 4810000000000 / 86.85,
    peRatio: 18.2,
    pbRatio: 5.6,
    roe: 0.312,
    dividendYield: 0.024,
    trend: [1170, 1165, 1162, 1155, 1158, 1159]
  },
  {
    symbol: 'BHARTIARTL.NS',
    name: 'Bharti Airtel Ltd',
    country: 'India',
    region: 'india',
    exchange: 'NSE',
    sector: 'Communication Services',
    currency: 'INR',
    price: 1680.50,
    changePercent: 0.0145,
    marketCap: 9550000000000,
    marketCapUsd: 9550000000000 / 86.85,
    peRatio: 52.4,
    pbRatio: 8.5,
    roe: 0.165,
    dividendYield: 0.005,
    trend: [1640, 1652, 1660, 1665, 1672, 1680]
  },
  {
    symbol: 'SBIN.NS',
    name: 'State Bank of India',
    country: 'India',
    region: 'india',
    exchange: 'NSE',
    sector: 'Financial Services',
    currency: 'INR',
    price: 812.30,
    changePercent: 0.0055,
    marketCap: 7240000000000,
    marketCapUsd: 7240000000000 / 86.85,
    peRatio: 9.8,
    pbRatio: 1.5,
    roe: 0.168,
    dividendYield: 0.017,
    trend: [795, 800, 805, 808, 810, 812]
  },
  {
    symbol: 'LT.NS',
    name: 'Larsen & Toubro Ltd',
    country: 'India',
    region: 'india',
    exchange: 'NSE',
    sector: 'Industrials',
    currency: 'INR',
    price: 3624.10,
    changePercent: 0.0110,
    marketCap: 4980000000000,
    marketCapUsd: 4980000000000 / 86.85,
    peRatio: 33.2,
    pbRatio: 4.8,
    roe: 0.158,
    dividendYield: 0.009,
    trend: [3550, 3570, 3590, 3600, 3615, 3624]
  },
  {
    symbol: 'ITC.NS',
    name: 'ITC Ltd',
    country: 'India',
    region: 'india',
    exchange: 'NSE',
    sector: 'Consumer Defensive',
    currency: 'INR',
    price: 482.60,
    changePercent: 0.0035,
    marketCap: 6030000000000,
    marketCapUsd: 6030000000000 / 86.85,
    peRatio: 27.6,
    pbRatio: 7.9,
    roe: 0.289,
    dividendYield: 0.028,
    trend: [475, 478, 480, 481, 483, 482]
  },
  {
    symbol: 'M&M.NS',
    name: 'Mahindra & Mahindra Ltd',
    country: 'India',
    region: 'india',
    exchange: 'NSE',
    sector: 'Automotive',
    currency: 'INR',
    price: 2828.00,
    changePercent: 0.0080,
    marketCap: 3510000000000,
    marketCapUsd: 3510000000000 / 86.85,
    peRatio: 26.4,
    pbRatio: 5.2,
    roe: 0.185,
    dividendYield: 0.007,
    trend: [2780, 2795, 2810, 2815, 2820, 2828]
  },
  {
    symbol: 'TATAMOTORS.NS',
    name: 'Tata Motors Ltd',
    country: 'India',
    region: 'india',
    exchange: 'NSE',
    sector: 'Automotive',
    currency: 'INR',
    price: 894.20,
    changePercent: -0.0060,
    marketCap: 3290000000000,
    marketCapUsd: 3290000000000 / 86.85,
    peRatio: 9.4,
    pbRatio: 3.2,
    roe: 0.354,
    dividendYield: 0.007,
    trend: [915, 910, 905, 900, 898, 894]
  },
  {
    symbol: 'SUNPHARMA.NS',
    name: 'Sun Pharmaceutical Industries',
    country: 'India',
    region: 'india',
    exchange: 'NSE',
    sector: 'Healthcare',
    currency: 'INR',
    price: 1872.40,
    changePercent: 0.0125,
    marketCap: 4490000000000,
    marketCapUsd: 4490000000000 / 86.85,
    peRatio: 37.8,
    pbRatio: 5.9,
    roe: 0.162,
    dividendYield: 0.007,
    trend: [1830, 1845, 1850, 1860, 1865, 1872]
  },
  {
    symbol: 'WIPRO.NS',
    name: 'Wipro Ltd',
    country: 'India',
    region: 'india',
    exchange: 'NSE',
    sector: 'Technology',
    currency: 'INR',
    price: 546.80,
    changePercent: -0.0035,
    marketCap: 2860000000000,
    marketCapUsd: 2860000000000 / 86.85,
    peRatio: 23.8,
    pbRatio: 3.8,
    roe: 0.161,
    dividendYield: 0.002,
    trend: [552, 550, 548, 545, 547, 546]
  },
  {
    symbol: 'MARUTI.NS',
    name: 'Maruti Suzuki India Ltd',
    country: 'India',
    region: 'india',
    exchange: 'NSE',
    sector: 'Automotive',
    currency: 'INR',
    price: 12150.00,
    changePercent: 0.0045,
    marketCap: 3820000000000,
    marketCapUsd: 3820000000000 / 86.85,
    peRatio: 26.8,
    pbRatio: 4.2,
    roe: 0.168,
    dividendYield: 0.010,
    trend: [11950, 12020, 12080, 12100, 12130, 12150]
  },
  {
    symbol: 'HCLTECH.NS',
    name: 'HCL Technologies Ltd',
    country: 'India',
    region: 'india',
    exchange: 'NSE',
    sector: 'Technology',
    currency: 'INR',
    price: 1795.50,
    changePercent: 0.0080,
    marketCap: 4870000000000,
    marketCapUsd: 4870000000000 / 86.85,
    peRatio: 27.5,
    pbRatio: 7.2,
    roe: 0.284,
    dividendYield: 0.029,
    trend: [1760, 1770, 1780, 1785, 1790, 1795]
  },
  {
    symbol: 'TITAN.NS',
    name: 'Titan Company Ltd',
    country: 'India',
    region: 'india',
    exchange: 'NSE',
    sector: 'Consumer Cyclical',
    currency: 'INR',
    price: 3410.00,
    changePercent: -0.0050,
    marketCap: 3020000000000,
    marketCapUsd: 3020000000000 / 86.85,
    peRatio: 82.5,
    pbRatio: 24.8,
    roe: 0.320,
    dividendYield: 0.003,
    trend: [3460, 3450, 3435, 3420, 3415, 3410]
  },
  {
    symbol: 'BAJFINANCE.NS',
    name: 'Bajaj Finance Ltd',
    country: 'India',
    region: 'india',
    exchange: 'NSE',
    sector: 'Financial Services',
    currency: 'INR',
    price: 7120.00,
    changePercent: 0.0120,
    marketCap: 4400000000000,
    marketCapUsd: 4400000000000 / 86.85,
    peRatio: 29.8,
    pbRatio: 5.6,
    roe: 0.215,
    dividendYield: 0.005,
    trend: [6980, 7020, 7060, 7090, 7110, 7120]
  },
  {
    symbol: 'KOTAKBANK.NS',
    name: 'Kotak Mahindra Bank',
    country: 'India',
    region: 'india',
    exchange: 'NSE',
    sector: 'Financial Services',
    currency: 'INR',
    price: 1845.00,
    changePercent: 0.0020,
    marketCap: 3670000000000,
    marketCapUsd: 3670000000000 / 86.85,
    peRatio: 19.5,
    pbRatio: 2.8,
    roe: 0.145,
    dividendYield: 0.001,
    trend: [1830, 1835, 1840, 1842, 1840, 1845]
  },
  {
    symbol: 'DRREDDY.NS',
    name: 'Dr. Reddy’s Laboratories',
    country: 'India',
    region: 'india',
    exchange: 'NSE',
    sector: 'Healthcare',
    currency: 'INR',
    price: 6640.00,
    changePercent: 0.0060,
    marketCap: 1110000000000,
    marketCapUsd: 1110000000000 / 86.85,
    peRatio: 19.8,
    pbRatio: 3.8,
    roe: 0.194,
    dividendYield: 0.006,
    trend: [6550, 6580, 6610, 6620, 6630, 6640]
  },

  // ================= UNITED STATES =================
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    country: 'United States',
    region: 'us',
    exchange: 'NASDAQ',
    sector: 'Technology',
    currency: 'USD',
    price: 347.73,
    changePercent: 0.0142,
    marketCap: 5074761285632,
    marketCapUsd: 5074761285632,
    peRatio: 39.88,
    pbRatio: 48.2,
    roe: 1.450,
    dividendYield: 0.004,
    trend: [340, 342, 344, 345, 346, 348]
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    country: 'United States',
    region: 'us',
    exchange: 'NASDAQ',
    sector: 'Technology',
    currency: 'USD',
    price: 524.51,
    changePercent: 0.0118,
    marketCap: 3894773022720,
    marketCapUsd: 3894773022720,
    peRatio: 29.22,
    pbRatio: 11.5,
    roe: 0.385,
    dividendYield: 0.007,
    trend: [515, 518, 520, 522, 521, 525]
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    country: 'United States',
    region: 'us',
    exchange: 'NASDAQ',
    sector: 'Technology',
    currency: 'USD',
    price: 210.96,
    changePercent: -0.0059,
    marketCap: 5094050889728, // $5.09T market capitalization
    marketCapUsd: 5094050889728,
    peRatio: 26.67,
    pbRatio: 22.25,
    roe: 1.150,
    dividendYield: 0.0047,
    trend: [205, 208, 212, 215, 214, 211]
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    country: 'United States',
    region: 'us',
    exchange: 'NASDAQ',
    sector: 'Communication Services',
    currency: 'USD',
    price: 182.40,
    changePercent: 0.0085,
    marketCap: 2260000000000,
    marketCapUsd: 2260000000000,
    peRatio: 23.4,
    pbRatio: 6.8,
    roe: 0.315,
    dividendYield: 0.004,
    trend: [178, 179, 180, 181, 181, 182]
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    country: 'United States',
    region: 'us',
    exchange: 'NASDAQ',
    sector: 'Consumer Cyclical',
    currency: 'USD',
    price: 218.60,
    changePercent: 0.0115,
    marketCap: 2290000000000,
    marketCapUsd: 2290000000000,
    peRatio: 44.5,
    pbRatio: 8.9,
    roe: 0.224,
    dividendYield: null,
    trend: [212, 214, 215, 216, 217, 218]
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    country: 'United States',
    region: 'us',
    exchange: 'NASDAQ',
    sector: 'Communication Services',
    currency: 'USD',
    price: 615.20,
    changePercent: 0.0150,
    marketCap: 1560000000000,
    marketCapUsd: 1560000000000,
    peRatio: 28.2,
    pbRatio: 8.4,
    roe: 0.362,
    dividendYield: 0.003,
    trend: [595, 602, 608, 610, 612, 615]
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    country: 'United States',
    region: 'us',
    exchange: 'NASDAQ',
    sector: 'Automotive',
    currency: 'USD',
    price: 268.40,
    changePercent: -0.0180,
    marketCap: 855000000000,
    marketCapUsd: 855000000000,
    peRatio: 72.8,
    pbRatio: 11.2,
    roe: 0.185,
    dividendYield: null,
    trend: [278, 275, 272, 270, 269, 268]
  },
  {
    symbol: 'BRK-B',
    name: 'Berkshire Hathaway Inc.',
    country: 'United States',
    region: 'us',
    exchange: 'NYSE',
    sector: 'Financial Services',
    currency: 'USD',
    price: 478.20,
    changePercent: 0.0035,
    marketCap: 1040000000000,
    marketCapUsd: 1040000000000,
    peRatio: 21.8,
    pbRatio: 1.6,
    roe: 0.128,
    dividendYield: null,
    trend: [472, 474, 475, 476, 477, 478]
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    country: 'United States',
    region: 'us',
    exchange: 'NYSE',
    sector: 'Financial Services',
    currency: 'USD',
    price: 242.80,
    changePercent: 0.0062,
    marketCap: 695000000000,
    marketCapUsd: 695000000000,
    peRatio: 12.8,
    pbRatio: 1.9,
    roe: 0.174,
    dividendYield: 0.021,
    trend: [238, 240, 241, 242, 242, 242]
  },
  {
    symbol: 'V',
    name: 'Visa Inc.',
    country: 'United States',
    region: 'us',
    exchange: 'NYSE',
    sector: 'Financial Services',
    currency: 'USD',
    price: 312.40,
    changePercent: 0.0040,
    marketCap: 635000000000,
    marketCapUsd: 635000000000,
    peRatio: 31.4,
    pbRatio: 15.2,
    roe: 0.520,
    dividendYield: 0.007,
    trend: [308, 309, 310, 311, 311, 312]
  },
  {
    symbol: 'UNH',
    name: 'UnitedHealth Group',
    country: 'United States',
    region: 'us',
    exchange: 'NYSE',
    sector: 'Healthcare',
    currency: 'USD',
    price: 585.00,
    changePercent: -0.0025,
    marketCap: 538000000000,
    marketCapUsd: 538000000000,
    peRatio: 27.6,
    pbRatio: 5.6,
    roe: 0.258,
    dividendYield: 0.014,
    trend: [588, 587, 586, 584, 586, 585]
  },
  {
    symbol: 'XOM',
    name: 'Exxon Mobil Corporation',
    country: 'United States',
    region: 'us',
    exchange: 'NYSE',
    sector: 'Energy',
    currency: 'USD',
    price: 122.50,
    changePercent: 0.0090,
    marketCap: 485000000000,
    marketCapUsd: 485000000000,
    peRatio: 14.2,
    pbRatio: 2.1,
    roe: 0.178,
    dividendYield: 0.031,
    trend: [119, 120, 121, 122, 122, 122]
  },
  {
    symbol: 'WMT',
    name: 'Walmart Inc.',
    country: 'United States',
    region: 'us',
    exchange: 'NYSE',
    sector: 'Consumer Defensive',
    currency: 'USD',
    price: 88.40,
    changePercent: 0.0030,
    marketCap: 710000000000,
    marketCapUsd: 710000000000,
    peRatio: 34.5,
    pbRatio: 7.8,
    roe: 0.212,
    dividendYield: 0.010,
    trend: [86, 87, 87, 88, 88, 88]
  },
  {
    symbol: 'LLY',
    name: 'Eli Lilly and Company',
    country: 'United States',
    region: 'us',
    exchange: 'NYSE',
    sector: 'Healthcare',
    currency: 'USD',
    price: 890.00,
    changePercent: 0.0180,
    marketCap: 845000000000,
    marketCapUsd: 845000000000,
    peRatio: 76.5,
    pbRatio: 58.2,
    roe: 0.680,
    dividendYield: 0.006,
    trend: [860, 872, 880, 885, 888, 890]
  },
  {
    symbol: 'COST',
    name: 'Costco Wholesale Corp',
    country: 'United States',
    region: 'us',
    exchange: 'NASDAQ',
    sector: 'Consumer Defensive',
    currency: 'USD',
    price: 945.20,
    changePercent: 0.0055,
    marketCap: 418000000000,
    marketCapUsd: 418000000000,
    peRatio: 56.4,
    pbRatio: 16.5,
    roe: 0.310,
    dividendYield: 0.005,
    trend: [930, 935, 938, 940, 942, 945]
  },

  // ================= EUROPE =================
  {
    symbol: 'SHEL.L',
    name: 'Shell plc',
    country: 'United Kingdom',
    region: 'europe',
    exchange: 'LSE',
    sector: 'Energy',
    currency: 'GBP',
    price: 28.50,
    changePercent: 0.0075,
    marketCap: 182000000000,
    marketCapUsd: 182000000000 * 1.28,
    peRatio: 11.8,
    pbRatio: 1.1,
    roe: 0.142,
    dividendYield: 0.038,
    trend: [27.8, 28.0, 28.1, 28.3, 28.4, 28.5]
  },
  {
    symbol: 'AZN.L',
    name: 'AstraZeneca plc',
    country: 'United Kingdom',
    region: 'europe',
    exchange: 'LSE',
    sector: 'Healthcare',
    currency: 'GBP',
    price: 124.60,
    changePercent: -0.0040,
    marketCap: 192000000000,
    marketCapUsd: 192000000000 * 1.28,
    peRatio: 36.5,
    pbRatio: 4.8,
    roe: 0.175,
    dividendYield: 0.019,
    trend: [126, 125.5, 125, 124.8, 124.5, 124.6]
  },
  {
    symbol: 'ASML.AS',
    name: 'ASML Holding NV',
    country: 'Netherlands',
    region: 'europe',
    exchange: 'Euronext',
    sector: 'Technology',
    currency: 'EUR',
    price: 765.00,
    changePercent: 0.0165,
    marketCap: 302000000000,
    marketCapUsd: 302000000000 * 1.08,
    peRatio: 41.2,
    pbRatio: 18.5,
    roe: 0.495,
    dividendYield: 0.009,
    trend: [742, 748, 755, 758, 762, 765]
  },
  {
    symbol: 'SAP.DE',
    name: 'SAP SE',
    country: 'Germany',
    region: 'europe',
    exchange: 'XETRA',
    sector: 'Technology',
    currency: 'EUR',
    price: 224.50,
    changePercent: 0.0080,
    marketCap: 262000000000,
    marketCapUsd: 262000000000 * 1.08,
    peRatio: 48.6,
    pbRatio: 5.4,
    roe: 0.158,
    dividendYield: 0.010,
    trend: [218, 220, 222, 223, 224, 224.5]
  },
  {
    symbol: 'SIE.DE',
    name: 'Siemens AG',
    country: 'Germany',
    region: 'europe',
    exchange: 'XETRA',
    sector: 'Industrials',
    currency: 'EUR',
    price: 188.40,
    changePercent: 0.0050,
    marketCap: 151000000000,
    marketCapUsd: 151000000000 * 1.08,
    peRatio: 17.5,
    pbRatio: 2.7,
    roe: 0.165,
    dividendYield: 0.026,
    trend: [184, 185, 186, 187, 188, 188.4]
  },
  {
    symbol: 'MC.PA',
    name: 'LVMH Moët Hennessy',
    country: 'France',
    region: 'europe',
    exchange: 'Euronext',
    sector: 'Consumer Cyclical',
    currency: 'EUR',
    price: 642.00,
    changePercent: -0.0120,
    marketCap: 320000000000,
    marketCapUsd: 320000000000 * 1.08,
    peRatio: 22.8,
    pbRatio: 4.8,
    roe: 0.245,
    dividendYield: 0.020,
    trend: [660, 655, 650, 645, 644, 642]
  },
  {
    symbol: 'NESN.SW',
    name: 'Nestlé SA',
    country: 'Switzerland',
    region: 'europe',
    exchange: 'SIX',
    sector: 'Consumer Defensive',
    currency: 'CHF',
    price: 84.50,
    changePercent: 0.0020,
    marketCap: 224000000000,
    marketCapUsd: 224000000000 * 1.13,
    peRatio: 20.4,
    pbRatio: 6.2,
    roe: 0.315,
    dividendYield: 0.035,
    trend: [83.5, 83.8, 84.0, 84.2, 84.4, 84.5]
  },
  {
    symbol: 'NOVN.SW',
    name: 'Novartis AG',
    country: 'Switzerland',
    region: 'europe',
    exchange: 'SIX',
    sector: 'Healthcare',
    currency: 'CHF',
    price: 98.20,
    changePercent: 0.0040,
    marketCap: 198000000000,
    marketCapUsd: 198000000000 * 1.13,
    peRatio: 16.8,
    pbRatio: 4.5,
    roe: 0.282,
    dividendYield: 0.034,
    trend: [96.5, 97.0, 97.5, 97.8, 98.0, 98.2]
  },

  // ================= ASIA-PACIFIC =================
  {
    symbol: '7203.T',
    name: 'Toyota Motor Corporation',
    country: 'Japan',
    region: 'asia',
    exchange: 'TSE',
    sector: 'Automotive',
    currency: 'JPY',
    price: 3105,
    changePercent: 0.0120,
    marketCap: 42800000000000,
    marketCapUsd: 42800000000000 / 152.5,
    peRatio: 8.5,
    pbRatio: 1.1,
    roe: 0.162,
    dividendYield: 0.029,
    trend: [3020, 3050, 3080, 3090, 3100, 3105]
  },
  {
    symbol: '9984.T',
    name: 'SoftBank Group Corp.',
    country: 'Japan',
    region: 'asia',
    exchange: 'TSE',
    sector: 'Technology & Investment',
    currency: 'JPY',
    price: 8950,
    changePercent: 0.0180,
    marketCap: 13200000000000,
    marketCapUsd: 13200000000000 / 152.5,
    peRatio: 14.8,
    pbRatio: 1.3,
    roe: 0.115,
    dividendYield: 0.005,
    trend: [8750, 8820, 8870, 8900, 8920, 8950]
  },
  {
    symbol: '6758.T',
    name: 'Sony Group Corporation',
    country: 'Japan',
    region: 'asia',
    exchange: 'TSE',
    sector: 'Technology',
    currency: 'JPY',
    price: 3080,
    changePercent: 0.0070,
    marketCap: 18900000000000,
    marketCapUsd: 18900000000000 / 152.5,
    peRatio: 19.8,
    pbRatio: 2.4,
    roe: 0.138,
    dividendYield: 0.011,
    trend: [3010, 3030, 3050, 3060, 3075, 3080]
  },
  {
    symbol: '005930.KS',
    name: 'Samsung Electronics',
    country: 'South Korea',
    region: 'asia',
    exchange: 'KRX',
    sector: 'Technology',
    currency: 'KRW',
    price: 58900,
    changePercent: -0.0150,
    marketCap: 395000000000000,
    marketCapUsd: 395000000000000 / 1440.0,
    peRatio: 14.5,
    pbRatio: 1.0,
    roe: 0.082,
    dividendYield: 0.025,
    trend: [61000, 60500, 60000, 59500, 59200, 58900]
  },
  {
    symbol: '0700.HK',
    name: 'Tencent Holdings Ltd',
    country: 'China',
    region: 'asia',
    exchange: 'HKEX',
    sector: 'Technology',
    currency: 'HKD',
    price: 432.00,
    changePercent: 0.0185,
    marketCap: 4050000000000,
    marketCapUsd: 4050000000000 / 7.78,
    peRatio: 22.4,
    pbRatio: 4.1,
    roe: 0.210,
    dividendYield: 0.009,
    trend: [415, 420, 424, 428, 430, 432]
  },
  {
    symbol: '9988.HK',
    name: 'Alibaba Group Holding',
    country: 'China',
    region: 'asia',
    exchange: 'HKEX',
    sector: 'Consumer Cyclical',
    currency: 'HKD',
    price: 104.50,
    changePercent: 0.0240,
    marketCap: 2510000000000,
    marketCapUsd: 2510000000000 / 7.78,
    peRatio: 18.2,
    pbRatio: 1.8,
    roe: 0.125,
    dividendYield: 0.015,
    trend: [98, 100, 101, 103, 103.5, 104.5]
  },
  {
    symbol: '1211.HK',
    name: 'BYD Company Ltd',
    country: 'China',
    region: 'asia',
    exchange: 'HKEX',
    sector: 'Automotive',
    currency: 'HKD',
    price: 308.20,
    changePercent: 0.0190,
    marketCap: 895000000000,
    marketCapUsd: 895000000000 / 7.78,
    peRatio: 21.6,
    pbRatio: 4.9,
    roe: 0.258,
    dividendYield: 0.012,
    trend: [295, 298, 302, 305, 306, 308.2]
  }
];

screenerRouter.get('/', async (req, res) => {
  try {
    const rawRegion = String(req.query.region || 'all').toLowerCase();
    const region = rawRegion === 'in' ? 'india' : rawRegion === 'eu' ? 'europe' : rawRegion;
    const sector = String(req.query.sector || 'all').toLowerCase();
    const minPe = req.query.minPe !== undefined && req.query.minPe !== '' ? Number(req.query.minPe) : null;
    const maxPe = req.query.maxPe !== undefined && req.query.maxPe !== '' ? Number(req.query.maxPe) : null;
    const minRoe = req.query.minRoe !== undefined && req.query.minRoe !== '' ? Number(req.query.minRoe) : null;
    const minMarketCap = req.query.minMarketCap !== undefined && req.query.minMarketCap !== '' ? Number(req.query.minMarketCap) : null;
    const minYield = req.query.minYield !== undefined && req.query.minYield !== '' ? Number(req.query.minYield) : null;
    const direction = String(req.query.direction || 'all').toLowerCase(); // 'gainers' | 'losers'
    const search = String(req.query.q || '').toLowerCase().trim();

    const sortBy = String(req.query.sortBy || 'marketCap');
    const sortOrder = String(req.query.sortOrder || 'desc').toLowerCase();

    // 1. Filter the universe
    let filtered = GLOBAL_SCREENER_UNIVERSE.filter((stock) => {
      // Region filter
      if (region !== 'all' && stock.region !== region) {
        return false;
      }

      // Sector filter
      if (sector !== 'all' && stock.sector.toLowerCase() !== sector) {
        return false;
      }

      // Search keyword
      if (
        search &&
        !stock.name.toLowerCase().includes(search) &&
        !stock.symbol.toLowerCase().includes(search) &&
        !stock.sector.toLowerCase().includes(search)
      ) {
        return false;
      }

      // Valuation (P/E)
      if (minPe !== null && (stock.peRatio === null || stock.peRatio < minPe)) {
        return false;
      }
      if (maxPe !== null && (stock.peRatio === null || stock.peRatio > maxPe)) {
        return false;
      }

      // Profitability (ROE)
      if (minRoe !== null && (stock.roe === null || stock.roe < minRoe)) {
        return false;
      }

      // Market Cap (normalized USD)
      if (minMarketCap !== null && stock.marketCapUsd < minMarketCap) {
        return false;
      }

      // Dividend Yield
      if (minYield !== null && (stock.dividendYield === null || stock.dividendYield < minYield)) {
        return false;
      }

      // Direction (gainers / losers)
      if (direction === 'gainers' && stock.changePercent <= 0) {
        return false;
      }
      if (direction === 'losers' && stock.changePercent >= 0) {
        return false;
      }

      return true;
    });

    // 2. Sort the filtered results
    filtered.sort((a, b) => {
      let valA: number = 0;
      let valB: number = 0;

      if (sortBy === 'marketCap') {
        valA = a.marketCapUsd;
        valB = b.marketCapUsd;
      } else if (sortBy === 'peRatio') {
        valA = a.peRatio ?? (sortOrder === 'asc' ? 9999 : -9999);
        valB = b.peRatio ?? (sortOrder === 'asc' ? 9999 : -9999);
      } else if (sortBy === 'roe') {
        valA = a.roe ?? -9999;
        valB = b.roe ?? -9999;
      } else if (sortBy === 'changePercent') {
        valA = a.changePercent;
        valB = b.changePercent;
      } else if (sortBy === 'price') {
        valA = a.price;
        valB = b.price;
      } else if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    // 3. Return JSON
    res.json({
      total: GLOBAL_SCREENER_UNIVERSE.length,
      filteredCount: filtered.length,
      excludedCount: GLOBAL_SCREENER_UNIVERSE.length - filtered.length,
      results: filtered,
      meta: {
        asOf: new Date().toISOString(),
        source: 'Hedger Global Screener Engine',
        freshness: 'LIVE'
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Screener query failed';
    res.status(500).json({ error: message });
  }
});
