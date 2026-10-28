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
  private apiKeys: string[];
  private currentKeyIndex = 0;
  private baseUrl = 'https://finnhub.io/api/v1';

  constructor() {
    const keys = [
      config.FINNHUB_API_KEY,
      'dbgu251r01qj6jgqk3lgdbgu251r01qj6jgqk3m0'
    ].filter((k): k is string => Boolean(k && k.length > 5));
    // Deduplicate keys
    this.apiKeys = Array.from(new Set(keys));
  }

  private get apiKey(): string {
    return this.apiKeys[this.currentKeyIndex] || this.apiKeys[0] || '';
  }

  private rotateKey() {
    if (this.apiKeys.length > 1) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    }
  }

  public async getQuote(symbol: string): Promise<FinnhubQuote | null> {
    if (!quotaBudgeter.canExecute('finnhub', true)) {
      return null;
    }
    quotaBudgeter.recordCall('finnhub');

    // Try primary and secondary key
    for (let attempt = 0; attempt < Math.min(2, this.apiKeys.length); attempt++) {
      try {
        const cleanSymbol = symbol.split('.')[0] ?? symbol;
        const res = await fetch(`${this.baseUrl}/quote?symbol=${cleanSymbol}&token=${this.apiKey}`);
        if (res.status === 429) {
          quotaBudgeter.recordRateLimitHit('finnhub');
          this.rotateKey();
          continue;
        }
        if (!res.ok) {
          this.rotateKey();
          continue;
        }
        const data = (await res.json()) as FinnhubQuote;
        if (data && data.c > 0) {
          return data;
        }
      } catch (e) {
        this.rotateKey();
      }
    }
    return null;
  }

  public async getProfile(symbol: string): Promise<any | null> {
    if (!quotaBudgeter.canExecute('finnhub', true)) return null;
    quotaBudgeter.recordCall('finnhub');

    for (let attempt = 0; attempt < Math.min(2, this.apiKeys.length); attempt++) {
      try {
        const cleanSymbol = symbol.split('.')[0] ?? symbol;
        const res = await fetch(`${this.baseUrl}/stock/profile2?symbol=${cleanSymbol}&token=${this.apiKey}`);
        if (res.status === 429) {
          this.rotateKey();
          continue;
        }
        if (!res.ok) {
          this.rotateKey();
          continue;
        }
        return await res.json();
      } catch {
        this.rotateKey();
      }
    }
    return null;
  }

  public async getNews(symbol: string): Promise<any[]> {
    if (!quotaBudgeter.canExecute('finnhub', true)) return [];
    quotaBudgeter.recordCall('finnhub');

    for (let attempt = 0; attempt < Math.min(2, this.apiKeys.length); attempt++) {
      try {
        const cleanSymbol = symbol.split('.')[0] ?? symbol;
        const to = new Date().toISOString().slice(0, 10);
        const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
        const res = await fetch(`${this.baseUrl}/company-news?symbol=${cleanSymbol}&from=${from}&to=${to}&token=${this.apiKey}`);
        if (res.status === 429) {
          this.rotateKey();
          continue;
        }
        if (!res.ok) {
          this.rotateKey();
          continue;
        }
        const news = (await res.json()) as any[];
        return Array.isArray(news) ? news.slice(0, 6) : [];
      } catch {
        this.rotateKey();
      }
    }
    return [];
  }
}
