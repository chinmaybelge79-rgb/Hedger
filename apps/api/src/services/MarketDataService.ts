import { FinnhubAdapter } from '../providers/FinnhubAdapter.js';
import { AlphaVantageAdapter } from '../providers/AlphaVantageAdapter.js';
import { YfinanceAdapter } from '../providers/YfinanceAdapter.js';
import type { Quote, CompanyProfile, HistoricalBar, FinancialStatement, Instrument } from '@hedger/types';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class MarketDataService {
  private finnhub = new FinnhubAdapter();
  private alphavantage = new AlphaVantageAdapter();
  private yfinance = new YfinanceAdapter();
  private cache = new Map<string, CacheEntry<any>>();

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttlSeconds: number) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  public isIndian(symbol: string): boolean {
    return symbol.endsWith('.NS') || symbol.endsWith('.BO');
  }

  public isUS(symbol: string): boolean {
    if (symbol.startsWith('^') || symbol.includes('=')) return false;
    return !symbol.includes('.') || symbol.endsWith('.US');
  }

  public async getQuote(symbol: string): Promise<Quote | null> {
    const cacheKey = `quote:${symbol}`;
    const cached = this.getCached<Quote>(cacheKey);
    if (cached) return cached;

    const asOf = new Date().toISOString();

    // 1. For US stocks, attempt Finnhub first
    if (this.isUS(symbol)) {
      const fhQuote = await this.finnhub.getQuote(symbol);
      if (fhQuote && fhQuote.c > 0) {
        // Get shares from yfinance if available
        const info = await this.yfinance.getInfo(symbol);
        const shares = info?.sharesOutstanding ?? null;
        let mktCap = info?.marketCap ?? null;
        if (shares && (!mktCap || Math.abs(mktCap - fhQuote.c * shares) / mktCap > 0.05)) {
          mktCap = fhQuote.c * shares;
        }

        const quote: Quote = {
          symbol,
          price: fhQuote.c,
          change: fhQuote.d,
          changePercent: fhQuote.dp / 100,
          open: fhQuote.o,
          high: fhQuote.h,
          low: fhQuote.l,
          previousClose: fhQuote.pc,
          volume: null,
          marketCap: mktCap,
          sharesOutstanding: shares,
          currency: 'USD',
          meta: {
            freshness: 'LIVE',
            asOf,
            source: 'Finnhub'
          }
        };
        this.setCache(cacheKey, quote, 30);
        return quote;
      }
    }

    // 2. Indian and global symbols route to yfinance
    const yfQuote = await this.yfinance.getQuote(symbol);
    if (yfQuote) {
      const price = yfQuote.price;
      const shares = yfQuote.sharesOutstanding;
      let mktCap = yfQuote.marketCap;

      // Phase 10 Invariant: marketCap = price * sharesOutstanding
      if (shares && price) {
        const calculatedCap = price * shares;
        if (!mktCap || Math.abs(mktCap - calculatedCap) / (mktCap || 1) > 0.02) {
          mktCap = calculatedCap;
        }
      }

      const quote: Quote = {
        symbol: yfQuote.symbol,
        price: yfQuote.price,
        change: yfQuote.change,
        changePercent: yfQuote.changePercent,
        open: yfQuote.open,
        high: yfQuote.high,
        low: yfQuote.low,
        previousClose: yfQuote.previousClose,
        volume: yfQuote.volume,
        marketCap: mktCap,
        sharesOutstanding: shares,
        currency: yfQuote.currency || (this.isIndian(symbol) ? 'INR' : 'USD'),
        meta: {
          freshness: 'LIVE',
          asOf,
          source: 'yfinance (Gateway)'
        }
      };
      this.setCache(cacheKey, quote, 30);
      return quote;
    }

    return null;
  }

  public async getProfile(symbol: string): Promise<CompanyProfile | null> {
    const cacheKey = `profile:${symbol}`;
    const cached = this.getCached<CompanyProfile>(cacheKey);
    if (cached) return cached;

    const yfInfo = await this.yfinance.getInfo(symbol);
    if (!yfInfo) return null;

    const profile: CompanyProfile = {
      symbol,
      name: yfInfo.name,
      description: yfInfo.description,
      exchange: yfInfo.exchange,
      currency: yfInfo.currency,
      sector: yfInfo.sector,
      industry: yfInfo.industry,
      ceo: yfInfo.ceo,
      employees: yfInfo.employees,
      website: yfInfo.website,
      country: yfInfo.country,
      companyType: yfInfo.companyType,
      sharesOutstanding: yfInfo.sharesOutstanding,
      marketCap: yfInfo.marketCap,
      peRatio: yfInfo.peRatio,
      pbRatio: yfInfo.pbRatio,
      dividendYield: yfInfo.dividendYield,
      week52High: yfInfo.week52High,
      week52Low: yfInfo.week52Low,
      meta: {
        freshness: 'EOD',
        asOf: new Date().toISOString(),
        source: 'yfinance'
      }
    };

    this.setCache(cacheKey, profile, 600);
    return profile;
  }

  public async getHistory(symbol: string, period: string = '1y'): Promise<HistoricalBar[]> {
    const rawPeriod = (period || '1y').toLowerCase().trim();
    const periodMap: Record<string, string> = {
      '1m': '1mo',
      '1mo': '1mo',
      '3m': '3mo',
      '3mo': '3mo',
      '6m': '6mo',
      '6mo': '6mo',
      '1y': '1y',
      '2y': '2y',
      '3y': '3y',
      '5y': '5y',
      '10y': '10y',
      'all': 'max',
      'max': 'max'
    };
    const normalizedPeriod = periodMap[rawPeriod] || rawPeriod;
    const cacheKey = `history:${symbol}:${normalizedPeriod}`;
    const cached = this.getCached<HistoricalBar[]>(cacheKey);
    if (cached && cached.length > 0) return cached;

    const bars = await this.yfinance.getHistory(symbol, normalizedPeriod);
    if (bars && bars.length > 0) {
      this.setCache(cacheKey, bars, 300);
    }
    return bars || [];
  }

  public async getStatements(
    symbol: string,
    type: 'income' | 'balance' | 'cashflow',
    period: 'annual' | 'quarterly'
  ): Promise<FinancialStatement | null> {
    const cacheKey = `statements:${symbol}:${type}:${period}`;
    const cached = this.getCached<FinancialStatement>(cacheKey);
    if (cached) return cached;

    const res = await this.yfinance.getStatements(symbol, type, period);
    if (!res) return null;

    const statement: FinancialStatement = {
      symbol,
      type,
      period,
      currency: res.currency,
      fiscalDates: res.fiscalDates,
      rows: res.rows,
      meta: {
        freshness: period === 'annual' ? 'ANNUAL' : 'QUARTERLY',
        asOf: new Date().toISOString(),
        source: 'yfinance statements'
      }
    };

    this.setCache(cacheKey, statement, 3600);
    return statement;
  }

  public async searchInstruments(q: string): Promise<Instrument[]> {
    const hits = await this.yfinance.search(q);
    return hits.map((h) => ({
      symbol: h.symbol,
      name: h.name,
      exchange: h.exchange,
      currency: h.symbol.endsWith('.NS') ? 'INR' : 'USD',
      country: h.symbol.endsWith('.NS') ? 'India' : 'US',
      sector: h.sector || 'General',
      industry: h.industry || 'General',
      companyType: (h.sector && /bank|finance/i.test(h.sector)) ? 'bank' : 'standard',
      providerSymbols: { yfinance: h.symbol }
    }));
  }

  public async getNews(symbol: string): Promise<any[]> {
    if (this.isUS(symbol)) {
      return await this.finnhub.getNews(symbol);
    }
    return [];
  }
}

export const marketDataService = new MarketDataService();
