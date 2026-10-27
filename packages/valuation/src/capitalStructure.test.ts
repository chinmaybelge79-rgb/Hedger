import { describe, it, expect } from 'vitest';
import {
  estimateSyntheticCreditRating,
  unleverBetaRatio,
  releverBetaRatio,
  optimizeCapitalStructure,
  reconcileFiscalCalendars
} from './index.js';

describe('Capital Structure & Synthetic Rating Optimizer', () => {
  it('estimates synthetic rating correctly based on interest coverage', () => {
    const highCoverage = estimateSyntheticCreditRating(12.5);
    expect(highCoverage.rating).toBe('AAA');
    expect(highCoverage.defaultSpreadPercent).toBe(0.55);

    const moderateCoverage = estimateSyntheticCreditRating(3.5);
    expect(moderateCoverage.rating).toBe('A-');
    expect(moderateCoverage.defaultSpreadPercent).toBe(1.50);

    const distressCoverage = estimateSyntheticCreditRating(0.4);
    expect(distressCoverage.rating).toBe('D');
    expect(distressCoverage.defaultSpreadPercent).toBe(12.00);
  });

  it('unlevers and relevers beta via Hamada equation', () => {
    const levered = 1.4;
    const taxRate = 0.25;
    const debtToEquity = 0.5;

    const unlevered = unleverBetaRatio(levered, taxRate, debtToEquity);
    expect(unlevered).toBeCloseTo(1.0182, 3);

    const relevered = releverBetaRatio(unlevered, taxRate, debtToEquity);
    expect(relevered).toBeCloseTo(1.4, 2);
  });

  it('optimizes capital structure and finds minimum WACC', () => {
    const result = optimizeCapitalStructure({
      ebit: 100000,
      enterpriseValue: 1000000,
      currentDebt: 150000,
      unleveredBeta: 0.9,
      riskFreeRate: 4.2,
      equityRiskPremium: 5.0,
      taxRate: 0.25
    });

    expect(result.points.length).toBe(10);
    expect(result.optimalWACC).toBeLessThanOrEqual(result.currentWACC);
    expect(result.optimalDebtRatio).toBeGreaterThanOrEqual(0.1);
  });
});

describe('Fiscal Year Calendar Reconciliation Engine', () => {
  it('reconciles mismatched fiscal year endings into uniform TTM periods', () => {
    const result = reconcileFiscalCalendars(
      'RELIANCE.NS',
      'INR',
      ['2024-03-31', '2023-03-31'],
      { revenue: [900000, 800000], ebitda: [180000, 160000] },
      'AAPL',
      'USD',
      ['2024-09-30', '2023-09-30'],
      { revenue: [390000, 380000], ebitda: [130000, 125000] },
      'INR',
      1.0,
      86.5
    );

    expect(result.isAligned).toBe(false);
    expect(result.reconciledTTM.length).toBeGreaterThan(0);
    expect(result.quarterlyTimeline.length).toBe(4);
    expect(result.methodologyNotes.length).toBeGreaterThan(2);
  });
});
