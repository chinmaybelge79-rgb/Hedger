import fetch from 'node-fetch';
import { config } from '../config.js';
import { quotaBudgeter } from '../services/QuotaBudgeter.js';

export class YfinanceAdapter {
  private gatewayUrl: string;
  private secret: string;

  constructor() {
    this.gatewayUrl = config.YF_GATEWAY_URL;
    this.secret = config.YF_GATEWAY_SECRET;
  }

  private getHeaders(): Record<string, string> {
    return {
      'X-Gateway-Secret': this.secret,
      'Content-Type': 'application/json'
    };
  }

  private getDirectHeaders(): Record<string, string> {
    return {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/json'
    };
  }

  /**
   * Direct Yahoo Finance v8 chart fallback for quotes
   */
  public async getQuoteDirect(symbol: string): Promise<any | null> {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
      const res = await fetch(url, { headers: this.getDirectHeaders() });
      if (!res.ok) return null;
      const json = (await res.json()) as any;
      const meta = json.chart?.result?.[0]?.meta;
      const q0 = json.chart?.result?.[0]?.indicators?.quote?.[0];
      if (meta && typeof meta.regularMarketPrice === 'number' && meta.regularMarketPrice > 0) {
        const price = Math.round(meta.regularMarketPrice * 100) / 100;
        const prevClose = Math.round((meta.chartPreviousClose || meta.previousClose || price) * 100) / 100;
        const change = Math.round((price - prevClose) * 100) / 100;
        const changePercent = prevClose > 0 ? Math.round(((price - prevClose) / prevClose) * 10000) / 100 : 0;
        const rawOpen = (Array.isArray(q0?.open) ? q0.open[0] : null) ?? meta.regularMarketDayLow ?? price;
        const open = typeof rawOpen === 'number' ? Math.round(rawOpen * 100) / 100 : price;
        const high = typeof meta.regularMarketDayHigh === 'number' ? Math.round(meta.regularMarketDayHigh * 100) / 100 : price;
        const low = typeof meta.regularMarketDayLow === 'number' ? Math.round(meta.regularMarketDayLow * 100) / 100 : price;
        return {
          symbol: meta.symbol || symbol,
          price,
          change,
          changePercent,
          open,
          high,
          low,
          previousClose: prevClose,
          volume: meta.regularMarketVolume ?? (Array.isArray(q0?.volume) ? q0.volume[0] : null) ?? 0,
          marketCap: meta.marketCap ?? null,
          sharesOutstanding: meta.sharesOutstanding ?? null,
          currency: meta.currency || 'USD'
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Direct Yahoo Finance v8 chart fallback for historical bars
   */
  public async getHistoryDirect(symbol: string, period: string = '1y', interval: string = '1d'): Promise<any[]> {
    try {
      const rangeMap: Record<string, string> = {
        '1d': '1d',
        '5d': '5d',
        '1mo': '1mo',
        '3mo': '3mo',
        '6mo': '6mo',
        '1y': '1y',
        '2y': '2y',
        '5y': '5y',
        '10y': '10y',
        'max': 'max'
      };
      const validRange = rangeMap[period] || '1y';
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${validRange}&interval=${interval}`;
      const res = await fetch(url, { headers: this.getDirectHeaders() });
      if (!res.ok) return [];
      const json = (await res.json()) as any;
      const result = json.chart?.result?.[0];
      if (!result || !Array.isArray(result.timestamp)) return [];

      const ts = result.timestamp;
      const q = result.indicators?.quote?.[0];
      const bars: any[] = [];
      for (let i = 0; i < ts.length; i++) {
        const c = q?.close?.[i];
        if (typeof c === 'number' && !isNaN(c) && c > 0) {
          const o = q?.open?.[i] ?? c;
          const h = q?.high?.[i] ?? c;
          const l = q?.low?.[i] ?? c;
          const v = q?.volume?.[i] ?? 0;
          const date = new Date(ts[i] * 1000).toISOString().split('T')[0];
          bars.push({ date, open: o, high: h, low: l, close: c, volume: v });
        }
      }
      return bars;
    } catch {
      return [];
    }
  }

  public async getQuote(symbol: string): Promise<any | null> {
    if (!quotaBudgeter.canExecute('yfinance', true)) {
      // Fallback directly to Yahoo v8 chart if quota allows
      return this.getQuoteDirect(symbol);
    }
    quotaBudgeter.recordCall('yfinance');

    try {
      const res = await fetch(`${this.gatewayUrl}/quote?symbol=${encodeURIComponent(symbol)}`, {
        headers: this.getHeaders()
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data && typeof data.price === 'number') {
          return data;
        }
      }
    } catch {
      // Local gateway offline or not found, proceed to direct Yahoo v8 chart
    }

    return this.getQuoteDirect(symbol);
  }

  public async getInfo(symbol: string): Promise<any | null> {
    if (!quotaBudgeter.canExecute('yfinance', true)) return null;
    quotaBudgeter.recordCall('yfinance');

    try {
      const res = await fetch(`${this.gatewayUrl}/info?symbol=${encodeURIComponent(symbol)}`, {
        headers: this.getHeaders()
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  public async getHistory(symbol: string, period: string = '1y', interval: string = '1d'): Promise<any[]> {
    if (!quotaBudgeter.canExecute('yfinance', true)) {
      return this.getHistoryDirect(symbol, period, interval);
    }
    quotaBudgeter.recordCall('yfinance');

    try {
      const res = await fetch(
        `${this.gatewayUrl}/history?symbol=${encodeURIComponent(symbol)}&period=${period}&interval=${interval}`,
        { headers: this.getHeaders() }
      );
      if (res.ok) {
        const data = (await res.json()) as { bars: any[] };
        if (Array.isArray(data.bars) && data.bars.length > 0) {
          return data.bars;
        }
      }
    } catch {
      // Local gateway offline, fall back to direct Yahoo v8 chart
    }

    return this.getHistoryDirect(symbol, period, interval);
  }

  public async getStatements(
    symbol: string,
    type: 'income' | 'balance' | 'cashflow',
    period: 'annual' | 'quarterly'
  ): Promise<any | null> {
    if (!quotaBudgeter.canExecute('yfinance', true)) return null;
    quotaBudgeter.recordCall('yfinance');

    try {
      const res = await fetch(
        `${this.gatewayUrl}/statements?symbol=${encodeURIComponent(symbol)}&type=${type}&period=${period}`,
        { headers: this.getHeaders() }
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  public async search(q: string): Promise<any[]> {
    try {
      const res = await fetch(`${this.gatewayUrl}/search?q=${encodeURIComponent(q)}`, {
        headers: this.getHeaders()
      });
      if (!res.ok) return [];
      const data = (await res.json()) as { results: any[] };
      return data.results || [];
    } catch {
      return [];
    }
  }
}
