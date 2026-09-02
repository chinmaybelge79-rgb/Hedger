import { FinancialDataProvider, CompanyData, MarketData, IncomeStatementData, BalanceSheetData, CashFlowData, ShareData } from './base';
import { logger } from '@config/logger';

const BASE_URL = 'https://finnhub.io/api/v2';
const CACHE_TTL_SECONDS = 3600;

interface CacheEntry<T> { value: T; expires: number; }
const cache = new Map<string, CacheEntry<unknown>>();

function cacheGet<T>(key: string): T | null {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  if (hit) cache.delete(key);
  return null;
}

function cacheSet(key: string, value: unknown): void {
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_SECONDS * 1000 });
  if (cache.size > 500) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

/**
 * Finnhub real-market-data provider. Only active when PROVIDER_API_KEY is set.
 * Falls through (returns null) on any failure so the registry can try the next provider.
 */
export class FinnhubProvider implements FinancialDataProvider {
  name = 'finnhub';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchJson<T>(path: string): Promise<T | null> {
    try {
      const res = await fetch(`${BASE_URL}${path}${path.includes('?') ? '&' : '?'}token=${this.apiKey}`, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'hedger/1.0' },
      });
      if (res.status === 429 || res.status === 403) {
        logger.warn({ path, status: res.status }, 'Finnhub rate limited or forbidden');
        return null;
      }
      if (!res.ok) return null;
      const data = (await res.json()) as T;
      // Finnhub returns empty objects/arrays for unknown tickers
      if (data === null || data === undefined) return null;
      return data;
    } catch (e) {
      logger.debug({ path, err: String(e) }, 'Finnhub request failed');
      return null;
    }
  }

  async getCompany(ticker: string): Promise<CompanyData | null> {
    const key = `company:${ticker}`;
    const cached = cacheGet<CompanyData>(key);
    if (cached) return cached;

    const [profile] = (await this.fetchJson<Array<Record<string, string>>>(`/stock/profile2?symbol=${ticker}`)) ?? [];
    if (!profile || !profile.name) return null;

    const data: CompanyData = {
      ticker: ticker.toUpperCase(),
      name: profile.name,
      exchange: profile.exchange || 'NASDAQ',
      country: profile.country || 'US',
      currency: profile.currency || 'USD',
      sector: profile.finnhubIndustry || undefined,
      industry: profile.finnhubIndustry || undefined,
      description: undefined,
      website: profile.weburl || undefined,
      logoUrl: profile.logo || undefined,
    };
    cacheSet(key, data);
    return data;
  }

  async getMarketData(ticker: string): Promise<MarketData | null> {
    const key = `market:${ticker}`;
    const cached = cacheGet<MarketData>(key);
    if (cached) return cached;

    const [quote, candles] = await Promise.all([
      this.fetchJson<Record<string, number>>(`/quote?symbol=${ticker}`),
      this.fetchJson<{ s: string; c: number[]; o?: number[]; h?: number[]; l?: number[]; v?: number[]; t: number[] }>(`/stock/candle?symbol=${ticker}&resolution=D&count=1825`),
    ]);

    if (!quote || typeof quote.c !== 'number' || quote.c === 0) return null;

    const price = quote.c;
    const prev = quote.pc || price;
    const history: Array<{ date: string; open: number; high: number; low: number; close: number; volume: number; adjustedClose: number }> = [];

    if (candles && Array.isArray(candles.c)) {
      for (let i = 0; i < candles.c.length; i++) {
        history.push({
          date: new Date(candles.t[i] * 1000).toISOString().split('T')[0],
          open: candles.o?.[i] ?? candles.c[i],
          high: candles.h?.[i] ?? candles.c[i],
          low: candles.l?.[i] ?? candles.c[i],
          close: candles.c[i],
          volume: candles.v?.[i] ?? 0,
          adjustedClose: candles.c[i],
        });
      }
    }

    const data: MarketData = {
      price,
      change: price - prev,
      changePercent: prev > 0 ? (price - prev) / prev : 0,
      priceHistory: history,
    };
    cacheSet(key, data);
    return data;
  }

  async getIncomeStatement(ticker: string, period: string): Promise<IncomeStatementData | null> {
    // Finnhub financials are premium-only; signal unavailable so DB/mock data is used
    void period;
    void ticker;
    return null;
  }

  async getBalanceSheet(ticker: string, period: string): Promise<BalanceSheetData | null> {
    void period; void ticker;
    return null;
  }

  async getCashFlow(ticker: string, period: string): Promise<CashFlowData | null> {
    void period; void ticker;
    return null;
  }

  async getShares(ticker: string, period: string): Promise<ShareData | null> {
    void period; void ticker;
    return null;
  }

  async searchCompanies(query: string): Promise<Array<{ symbol: string; name: string; exchange: string; type: string; currency: string }>> {
    const data = await this.fetchJson<{ result: Array<{ symbol: string; description: string; type: string; exchange?: string }> }>(`/search?q=${encodeURIComponent(query)}`);
    if (!data?.result) return [];
    return data.result
      .filter(r => r.type === 'Common Stock')
      .slice(0, 20)
      .map(r => ({
        symbol: r.symbol,
        name: r.description,
        exchange: r.exchange || 'NASDAQ',
        type: r.type,
        currency: 'USD',
      }));
  }
}
