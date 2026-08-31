import { prisma } from '@config/database';
import { redis } from '@config/redis';
import { SearchQuery, SearchResult } from '@api/schemas/search';
import { logger } from '@config/logger';

const SEARCH_CACHE_TTL = 300;
const UNIVERSE_CACHE_KEY = 'search:universe';

const DEFAULT_UNIVERSE = [
  { sym: 'AAPL', name: 'Apple Inc.', exch: 'NASDAQ' },
  { sym: 'MSFT', name: 'Microsoft Corp.', exch: 'NASDAQ' },
  { sym: 'GOOGL', name: 'Alphabet Inc.', exch: 'NASDAQ' },
  { sym: 'GOOG', name: 'Alphabet Inc.', exch: 'NASDAQ' },
  { sym: 'AMZN', name: 'Amazon.com Inc.', exch: 'NASDAQ' },
  { sym: 'NVDA', name: 'NVIDIA Corp.', exch: 'NASDAQ' },
  { sym: 'TSLA', name: 'Tesla Inc.', exch: 'NASDAQ' },
  { sym: 'META', name: 'Meta Platforms Inc.', exch: 'NASDAQ' },
  { sym: 'BRK.B', name: 'Berkshire Hathaway Inc.', exch: 'NYSE' },
  { sym: 'JPM', name: 'JPMorgan Chase & Co.', exch: 'NYSE' },
  { sym: 'JNJ', name: 'Johnson & Johnson', exch: 'NYSE' },
  { sym: 'V', name: 'Visa Inc.', exch: 'NYSE' },
  { sym: 'WMT', name: 'Walmart Inc.', exch: 'NYSE' },
  { sym: 'PG', name: 'Procter & Gamble Co.', exch: 'NYSE' },
  { sym: 'UNH', name: 'UnitedHealth Group Inc.', exch: 'NYSE' },
  { sym: 'HD', name: 'Home Depot Inc.', exch: 'NYSE' },
  { sym: 'MA', name: 'Mastercard Inc.', exch: 'NYSE' },
  { sym: 'DIS', name: 'Walt Disney Co.', exch: 'NYSE' },
  { sym: 'PYPL', name: 'PayPal Holdings Inc.', exch: 'NASDAQ' },
  { sym: 'ADBE', name: 'Adobe Inc.', exch: 'NASDAQ' },
  { sym: 'NFLX', name: 'Netflix Inc.', exch: 'NASDAQ' },
  { sym: 'CRM', name: 'Salesforce Inc.', exch: 'NYSE' },
  { sym: 'INTC', name: 'Intel Corp.', exch: 'NASDAQ' },
  { sym: 'CSCO', name: 'Cisco Systems Inc.', exch: 'NASDAQ' },
  { sym: 'PFE', name: 'Pfizer Inc.', exch: 'NYSE' },
  { sym: 'KO', name: 'Coca-Cola Co.', exch: 'NYSE' },
  { sym: 'PEP', name: 'PepsiCo Inc.', exch: 'NASDAQ' },
  { sym: 'T', name: 'AT&T Inc.', exch: 'NYSE' },
  { sym: 'VZ', name: 'Verizon Communications Inc.', exch: 'NYSE' },
  { sym: 'XOM', name: 'Exxon Mobil Corp.', exch: 'NYSE' },
  { sym: 'CVX', name: 'Chevron Corp.', exch: 'NYSE' },
  { sym: 'LLY', name: 'Eli Lilly and Co.', exch: 'NYSE' },
  { sym: 'ABBV', name: 'AbbVie Inc.', exch: 'NYSE' },
  { sym: 'MRK', name: 'Merck & Co. Inc.', exch: 'NYSE' },
  { sym: 'TMO', name: 'Thermo Fisher Scientific Inc.', exch: 'NYSE' },
  { sym: 'AVGO', name: 'Broadcom Inc.', exch: 'NASDAQ' },
  { sym: 'ORCL', name: 'Oracle Corp.', exch: 'NYSE' },
  { sym: 'COST', name: 'Costco Wholesale Corp.', exch: 'NASDAQ' },
];

async function getUniverse(): Promise<Array<{ sym: string; name: string; exch: string }>> {
  const cached = await redis.get(UNIVERSE_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached);
  }

  const companies = await prisma.company.findMany({
    where: { isActive: true },
    select: { ticker: true, name: true, exchange: true },
    take: 500,
  });

  const universe = companies.map((c) => ({ sym: c.ticker, name: c.name, exch: c.exchange }));
  await redis.setex(UNIVERSE_CACHE_KEY, 3600, JSON.stringify(universe));
  return universe;
}

export async function searchCompanies(query: SearchQuery): Promise<SearchResult[]> {
  const { q, limit } = query;
  const normalizedQuery = q.toUpperCase().trim();

  const universe = await getUniverse();

  const exactMatches = universe.filter(u => u.sym === normalizedQuery);
  const prefixMatches = universe.filter(u => u.sym.startsWith(normalizedQuery) && u.sym !== normalizedQuery);
  const nameMatches = universe.filter(
    u => u.name.toUpperCase().includes(normalizedQuery) &&
         !u.sym.startsWith(normalizedQuery) &&
         u.sym !== normalizedQuery
  );

  const combined = [...exactMatches, ...prefixMatches, ...nameMatches].slice(0, limit);

  return combined.map(u => ({
    symbol: u.sym,
    name: u.name,
    exchange: u.exch,
    type: 'EQUITY',
    currency: 'USD',
  }));
}

export async function getCompanyByTicker(ticker: string): Promise<SearchResult | null> {
  const company = await prisma.company.findUnique({
    where: { ticker: ticker.toUpperCase() },
    select: { ticker: true, name: true, exchange: true, currency: true },
  });

  if (!company) return null;

  return {
    symbol: company.ticker,
    name: company.name,
    exchange: company.exchange,
    type: 'EQUITY',
    currency: company.currency,
  };
}