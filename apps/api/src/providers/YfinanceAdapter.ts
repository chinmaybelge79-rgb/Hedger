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

  public async getQuote(symbol: string): Promise<any | null> {
    if (!quotaBudgeter.canExecute('yfinance', true)) return null;
    quotaBudgeter.recordCall('yfinance');

    try {
      const res = await fetch(`${this.gatewayUrl}/quote?symbol=${encodeURIComponent(symbol)}`, {
        headers: this.getHeaders()
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
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
    if (!quotaBudgeter.canExecute('yfinance', true)) return [];
    quotaBudgeter.recordCall('yfinance');

    try {
      const res = await fetch(
        `${this.gatewayUrl}/history?symbol=${encodeURIComponent(symbol)}&period=${period}&interval=${interval}`,
        { headers: this.getHeaders() }
      );
      if (!res.ok) return [];
      const data = (await res.json()) as { bars: any[] };
      return data.bars || [];
    } catch {
      return [];
    }
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
