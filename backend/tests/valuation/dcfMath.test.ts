import { describe, it, expect } from 'vitest';
import { runDcfMath, type DcfCompanyBase } from '../../src/valuation/dcf/dcfEngine';

const base: DcfCompanyBase = {
  baseRevenue: 1000,
  baseDepreciation: 50,
  baseCapex: 80,
  baseNwc: 100,
  netDebt: 200, // already net of cash
  sharesOutstanding: 10,
  currentPrice: 150,
};

const params = {
  forecastYears: 2,
  revenueGrowth: [0.1, 0.1],
  ebitMargin: [0.3, 0.3],
  taxRate: 0.25,
  wacc: 0.1,
  terminalGrowth: 0.02,
};

describe('runDcfMath (pure core)', () => {
  it('does not double-count cash in equity value', () => {
    const result = runDcfMath(base, params);
    // equityValue must be exactly EV - netDebt
    expect(result.equityValue).toBeCloseTo(result.enterpriseValue - base.netDebt, 8);
  });

  it('computes a correct first forecast year', () => {
    const result = runDcfMath(base, params);
    const y1 = result.forecast[0];
    expect(y1.revenue).toBeCloseTo(1100);
    expect(y1.ebit).toBeCloseTo(330);          // 1100 * 0.3
    expect(y1.ebitda).toBeCloseTo(330 + 55);   // ebit + scaled D&A (1100/1000 * 50)
    expect(y1.tax).toBeCloseTo(82.5);          // 330 * 0.25
    expect(y1.nopat).toBeCloseTo(247.5);
    // nwc scales with revenue: 100 * 1.1 = 110 → change = 10
    expect(y1.changeInNwc).toBeCloseTo(10);
  });

  it('guards against zero base revenue (no NaN)', () => {
    const result = runDcfMath({ ...base, baseRevenue: 0 }, params);
    for (const f of result.forecast) {
      expect(isFinite(f.revenue)).toBe(true);
      expect(isFinite(f.fcff)).toBe(true);
      expect(isFinite(f.pvFcff)).toBe(true);
    }
    expect(isFinite(result.fairValuePerShare)).toBe(true);
  });

  it('rejects wacc <= terminal growth', () => {
    expect(() => runDcfMath(base, { ...params, wacc: 0.02, terminalGrowth: 0.02 }))
      .toThrow(/greater than terminal growth/i);
  });

  it('rejects growth/margin arrays that do not match forecast years', () => {
    expect(() => runDcfMath(base, { ...params, revenueGrowth: [0.1] }))
      .toThrow(/must match forecast years/i);
  });

  it('rejects non-positive shares outstanding', () => {
    expect(() => runDcfMath({ ...base, sharesOutstanding: 0 }, params))
      .toThrow(/shares outstanding must be positive/i);
  });

  it('discounts each year at (1 + wacc)^year', () => {
    const result = runDcfMath(base, params);
    const y2 = result.forecast[1];
    expect(y2.pvFcff).toBeCloseTo(y2.fcff / Math.pow(1.1, 2), 8);
  });

  it('runs 2000 iterations fast enough for Monte Carlo use (pure math, no I/O)', () => {
    const t0 = performance.now();
    for (let i = 0; i < 2000; i++) {
      runDcfMath(base, {
        ...params,
        forecastYears: 5,
        revenueGrowth: Array(5).fill(0.08),
        ebitMargin: Array(5).fill(0.3),
      });
    }
    const ms = performance.now() - t0;
    // 2000 pure runs must stay well under 2s (previously this would be ~4000 DB queries)
    expect(ms).toBeLessThan(2000);
  });
});
