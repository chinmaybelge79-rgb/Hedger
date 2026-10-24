import { describe, it, expect } from 'vitest';
import { AlphaVantageAdapter } from '../providers/AlphaVantageAdapter.js';
import { marketDataService } from './MarketDataService.js';

describe('Market Data Service & Phase 09/10 Invariants', () => {
  it('strictly blocks Alpha Vantage from the user request path', async () => {
    const av = new AlphaVantageAdapter();
    await expect(av.reconcileQuote('AAPL', true)).rejects.toThrow(
      'Alpha Vantage is blocked from the user request path'
    );
  });

  it('correctly classifies Indian and US symbols for regional routing', () => {
    expect(marketDataService.isIndian('RELIANCE.NS')).toBe(true);
    expect(marketDataService.isIndian('TCS.BO')).toBe(true);
    expect(marketDataService.isIndian('AAPL')).toBe(false);

    expect(marketDataService.isUS('AAPL')).toBe(true);
    expect(marketDataService.isUS('MSFT.US')).toBe(true);
    expect(marketDataService.isUS('RELIANCE.NS')).toBe(false);
  });
});
