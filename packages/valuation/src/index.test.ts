import { describe, it, expect } from 'vitest';
import { calculateDCF, reverseDCF, calculateScenarios } from './index.js';
import type { DCFInputs } from '@hedger/types';

describe('@hedger/valuation DCF Engine', () => {
  const sampleInputs: DCFInputs = {
    currentRevenue: 10000,
    revenueGrowthRates: [0.10, 0.10, 0.08, 0.08, 0.06],
    operatingMargin: 0.20,
    taxRate: 0.25,
    reinvestmentRate: 0.15,
    wacc: 0.10,
    terminalGrowthRate: 0.04,
    cashAndEquivalents: 2000,
    totalDebt: 1000,
    sharesOutstanding: 100,
    daRatio: 0.04,
    capexRatio: 0.05,
    nowcRatio: 0.12,
    baseNowc: 1200,
    terminalMethod: 'perpetual_growth',
    exitMultiple: 12.0
  };

  it('calculates DCF intrinsic value and margin of safety deterministically', () => {
    const currentPrice = 180;
    const output = calculateDCF({ inputs: sampleInputs, currentPrice });

    expect(output.projections.length).toBe(5);
    expect(output.enterpriseValue).toBeGreaterThan(0);
    expect(output.equityValue).toBeGreaterThan(output.enterpriseValue); // because cash > debt
    expect(output.intrinsicValuePerShare).toBeGreaterThan(0);
    expect(output.sensitivityGrid.length).toBe(5);
    expect(output.sensitivityGrid[0]?.length).toBe(5);
  });

  it('demonstrates DCF monotonicity (lower WACC produces higher valuation)', () => {
    const lowWaccInputs = { ...sampleInputs, wacc: 0.08 };
    const highWaccInputs = { ...sampleInputs, wacc: 0.12 };

    const lowWaccOut = calculateDCF({ inputs: lowWaccInputs, currentPrice: 100 });
    const highWaccOut = calculateDCF({ inputs: highWaccInputs, currentPrice: 100 });

    expect(lowWaccOut.intrinsicValuePerShare).toBeGreaterThan(highWaccOut.intrinsicValuePerShare);
  });

  it('solves reverse DCF round trip correctly', () => {
    const currentPrice = 150;
    const impliedGrowth = reverseDCF(sampleInputs, currentPrice);

    // Verify implied growth recovers currentPrice within small tolerance
    const recoveredInputs = {
      ...sampleInputs,
      revenueGrowthRates: [impliedGrowth, impliedGrowth, impliedGrowth, impliedGrowth, impliedGrowth]
    };
    const recovered = calculateDCF({ inputs: recoveredInputs, currentPrice });
    expect(Math.abs(recovered.intrinsicValuePerShare - currentPrice)).toBeLessThan(0.05);
  });

  it('generates Base, Bull, and Bear scenarios in correct rank order', () => {
    const { base, bull, bear } = calculateScenarios(sampleInputs, 150);
    expect(bull.intrinsicValuePerShare).toBeGreaterThan(base.intrinsicValuePerShare);
    expect(base.intrinsicValuePerShare).toBeGreaterThan(bear.intrinsicValuePerShare);
  });
});
