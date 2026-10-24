import fetch from 'node-fetch';
import { config } from '../config.js';
import { quotaBudgeter } from '../services/QuotaBudgeter.js';

export interface FinnhubQuote {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number; // high
  l: number; // low
  o: number; // open
  pc: number; // previous close
  t: number; // timestamp
}

export class FinnhubAdapter {
  private apiKey: string;
  private baseUrl = 'https://finnhub.io/api/v1';

  constructor() {
    this.apiKey = config.FINNHUB_API_KEY;
  }

  public async getQuote(symbol: string): Promise<FinnhubQuote | null> {
    if (!quotaBudgeter.canExecute('finnhub', true)) {
      return null;
    }
    quotaBudgeter.recordCall('finnhub');

    try {
      // Finnhub expects US symbols without exchange suffix (e.g. AAPL)
      const cleanSymbol = symbol.split('.')[0] ?? symbol;
      const res = await fetch(`${this.baseUrl}/quote?symbol=${cleanSymbol}&token=${this.apiKey}`);
      if (res.status === 429) {
        quotaBudgeter.recordRateLimitHit('finnhub');
        return null;
      }
      if (!res.ok) return null;
      const data = (await res.json()) as FinnhubQuote;
      if (data && data.c > 0) {
        return data;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  public async getProfile(symbol: string): Promise<any | null> {
    if (!quotaBudgeter.canExecute('finnhub', true)) return null;
    quotaBudgeter.recordCall('finnhub');

    try {
      const cleanSymbol = symbol.split('.')[0] ?? symbol;
      const res = await fetch(`${this.baseUrl}/stock/profile2?symbol=${cleanSymbol}&token=${this.apiKey}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  public async getNews(symbol: string): Promise<any[]> {
    if (!quotaBudgeter.canExecute('finnhub', true)) return [];
    quotaBudgeter.recordCall('finnhub');

    try {
      const cleanSymbol = symbol.split('.')[0] ?? symbol;
      const to = new Date().toISOString().slice(0, 10);
      const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const res = await fetch(`${this.baseUrl}/company-news?symbol=${cleanSymbol}&from=${from}&to=${to}&token=${this.apiKey}`);
      if (!res.ok) return [];
      const news = (await res.json()) as any[];
      return Array.isArray(news) ? news.slice(0, 6) : [];
    } catch {
      return [];
    }
  }
}
