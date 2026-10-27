import { describe, it, expect } from 'vitest';
import {
  calculateDCF,
  calculate10YearDCF,
  reverseDCF,
  calculateScenarios,
  build10YearGrowthTrajectory,
  calculateHamadaBeta,
  unleverBeta,
  getSyntheticRatingAndCostOfDebt,
  runMonteCarloSimulation
} from './index.js';
import type { DCFInputs } from '@hedger/types';

describe('@hedger/valuation Generalized 10-Year DCF Engine', () => {
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

  const sample10YearInputs: DCFInputs = {
    currentRevenue: 50000,
    nearTermGrowthRate: 0.15,
    revenueGrowthRates: [0.15, 0.15, 0.15, 0.12, 0.09, 0.06, 0.04, 0.03, 0.03, 0.03],
    operatingMargin: 0.25,
    baseGrossMargin: 0.55,
    targetGrossMargin: 0.60,
    baseOperatingMargin: 0.22,
    targetOperatingMargin: 0.26,
    taxRate: 0.21,
    reinvestmentRate: 0.20,
    wacc: 0.09,
    terminalGrowthRate: 0.03,
    cashAndEquivalents: 15000,
    totalDebt: 8000,
    sharesOutstanding: 2000,
    daRatio: 0.04,
    capexRatio: 0.045,
    nowcRatio: 0.10,
    terminalMethod: 'blended',
    exitMultiple: 16.0,
    projectionHorizonYears: 10
  };

  it('calculates legacy 5-year DCF intrinsic value and margin of safety deterministically', () => {
    const currentPrice = 180;
    const output = calculateDCF({ inputs: sampleInputs, currentPrice });

    expect(output.projections.length).toBe(5);
    expect(output.enterpriseValue).toBeGreaterThan(0);
    expect(output.equityValue).toBeGreaterThan(output.enterpriseValue); // because cash > debt
    expect(output.intrinsicValuePerShare).toBeGreaterThan(0);
    expect(output.sensitivityGrid.length).toBe(5);
    expect(output.sensitivityGrid[0]?.length).toBe(5);
  });

  it('calculates generalized 10-Year DCF with 3 growth phases and margin convergence', () => {
    const currentPrice = 45;
    const output = calculate10YearDCF({ inputs: sample10YearInputs, currentPrice });

    expect(output.projections.length).toBe(10);
    // Phase 1: High growth (years 1-3)
    expect(output.projections[0]?.phase).toBe('High Growth');
    expect(output.projections[2]?.phase).toBe('High Growth');
    // Phase 2: Transition (years 4-7)
    expect(output.projections[3]?.phase).toBe('Transition');
    expect(output.projections[6]?.phase).toBe('Transition');
    // Phase 3: Mature (years 8-10)
    expect(output.projections[7]?.phase).toBe('Mature');
    expect(output.projections[9]?.phase).toBe('Mature');

    // Margin convergence verification: Gross margin converges upwards
    expect(output.projections[9]!.grossMargin!).toBeGreaterThanOrEqual(output.projections[0]!.grossMargin!);

    // Enterprise Value and Equity Value Bridge
    expect(output.enterpriseValue).toBeGreaterThan(0);
    expect(output.netDebt).toBe(-7000); // 8000 debt - 15000 cash = -7000 net debt
    expect(output.equityValue).toBeGreaterThan(output.enterpriseValue);
    expect(output.intrinsicValuePerShare).toBeGreaterThan(0);

    // Triangulation matrix verification
    expect(output.triangulation).toBeDefined();
    expect(output.triangulation?.blendedIntrinsicValue).toBeGreaterThan(0);
    expect(output.triangulation?.weights.dcf).toBe(0.50);

    // Monte Carlo simulation verification
    expect(output.monteCarlo).toBeDefined();
    expect(output.monteCarlo?.iterations).toBe(2000);
    expect(output.monteCarlo?.p10).toBeLessThanOrEqual(output.monteCarlo?.p50!);
    expect(output.monteCarlo?.p50).toBeLessThanOrEqual(output.monteCarlo?.p90!);
    expect(output.monteCarlo?.histogram.length).toBe(10);
  });

  it('constructs multi-phase 10-year growth trajectory with linear deceleration', () => {
    const trajectory = build10YearGrowthTrajectory(0.20, 0.04);
    expect(trajectory.length).toBe(10);
    expect(trajectory[0]).toBe(0.20);
    expect(trajectory[1]).toBe(0.20);
    expect(trajectory[2]).toBe(0.20);
    // Deceleration years
    expect(trajectory[3]).toBeLessThan(0.20);
    expect(trajectory[6]).toBeCloseTo(0.04, 2);
    // Mature years
    expect(trajectory[7]).toBe(0.04);
    expect(trajectory[8]).toBe(0.04);
    expect(trajectory[9]).toBe(0.04);
  });

  it('correctly un-levers and re-levers beta using the Hamada Equation', () => {
    const leveredBeta = 1.35;
    const debt = 5000;
    const equity = 15000;
    const taxRate = 0.25;

    const unlevBeta = unleverBeta(leveredBeta, debt, equity, taxRate);
    expect(unlevBeta).toBeLessThan(leveredBeta);

    const relevered = calculateHamadaBeta(unlevBeta, debt, equity, taxRate);
    expect(relevered).toBeCloseTo(leveredBeta, 4);
  });

  it('maps Interest Coverage Ratio to synthetic credit ratings and cost of debt', () => {
    const tripleA = getSyntheticRatingAndCostOfDebt(1000, 100, 0.04);
    expect(tripleA.rating).toBe('AAA');
    expect(tripleA.spread).toBe(0.006);

    const bbb = getSyntheticRatingAndCostOfDebt(350, 100, 0.04);
    expect(bbb.rating).toBe('BBB');
    expect(bbb.spread).toBe(0.016);

    const distressed = getSyntheticRatingAndCostOfDebt(120, 100, 0.04);
    expect(distressed.rating).toContain('Distressed');
    expect(distressed.spread).toBe(0.060);
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

  it('executes Monte Carlo simulation with robust distribution percentiles', () => {
    const mc = runMonteCarloSimulation(sample10YearInputs, 40, 1000, 10);
    expect(mc.iterations).toBe(1000);
    expect(mc.p10).toBeLessThanOrEqual(mc.p25);
    expect(mc.p25).toBeLessThanOrEqual(mc.p50);
    expect(mc.p50).toBeLessThanOrEqual(mc.p75);
    expect(mc.p75).toBeLessThanOrEqual(mc.p90);
    expect(mc.verdict).toBeDefined();
  });
});
