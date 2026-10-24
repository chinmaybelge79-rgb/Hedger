import fetch from 'node-fetch';
import { config } from '../config.js';
import { quotaBudgeter } from '../services/QuotaBudgeter.js';

export class AlphaVantageAdapter {
  private apiKey: string;
  private baseUrl = 'https://www.alphavantage.co/query';

  constructor() {
    this.apiKey = config.ALPHAVANTAGE_API_KEY;
  }

  /**
   * Reconciles quote data in the background. Strictly blocked if called with isUserPath=true.
   */
  public async reconcileQuote(symbol: string, isUserPath: boolean = true): Promise<any | null> {
    if (isUserPath) {
      throw new Error('Alpha Vantage is blocked from the user request path per Phase 09 §5 invariant.');
    }

    if (!quotaBudgeter.canExecute('alphavantage', false)) {
      return null;
    }
    quotaBudgeter.recordCall('alphavantage');

    try {
      const cleanSymbol = symbol.split('.')[0] ?? symbol;
      const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${cleanSymbol}&apikey=${this.apiKey}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      return data;
    } catch {
      return null;
    }
  }
}
