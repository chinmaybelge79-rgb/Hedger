import { describe, it, expect } from 'vitest';
import {
  scoreMetric,
  computeFinancialAnalysis,
  validateNarrativeText,
  FORBIDDEN_WORDS
} from './financialAnalysis.js';
import { getLabelForScore } from './analysis.labels.js';

describe('Financial Analysis Engine (Workstream F)', () => {
  it('correctly scores metrics according to directional thresholds and the prompt worked example', () => {
    // Prompt's worked example: ROE 14% with thresholds 8%/20% → (14−8)/(20−8) = 0.5 → 50
    const workedExampleScore = scoreMetric(0.14, 0.08, 0.20, 'higher');
    expect(workedExampleScore).toBe(50);

    // Higher is better: above strong clamps to 100
    expect(scoreMetric(0.25, 0.08, 0.20, 'higher')).toBe(100);
    // Higher is better: below weak clamps to 0
    expect(scoreMetric(0.05, 0.08, 0.20, 'higher')).toBe(0);

    // Lower is better: Debt/Equity weak 1.5, strong 0.3
    // At strong threshold (0.3) -> 100
    expect(scoreMetric(0.30, 1.50, 0.30, 'lower')).toBe(100);
    // At weak threshold (1.5) -> 0
    expect(scoreMetric(1.50, 1.50, 0.30, 'lower')).toBe(0);
    // Below strong threshold (0.15) -> 100
    expect(scoreMetric(0.15, 1.50, 0.30, 'lower')).toBe(100);
    // In middle: (1.5 - 0.9) / (1.5 - 0.3) = 0.6 / 1.2 = 0.5 -> 50
    expect(scoreMetric(0.90, 1.50, 0.30, 'lower')).toBe(50);
  });

  it('correctly assigns neutral labels based on score and completeness', () => {
    // >= 65: Strong financials
    expect(getLabelForScore(75, 100).label).toBe('Strong financials');
    expect(getLabelForScore(65, 80).label).toBe('Strong financials');

    // 40 - 64: Mixed financials
    expect(getLabelForScore(64, 100).label).toBe('Mixed financials');
    expect(getLabelForScore(40, 90).label).toBe('Mixed financials');

    // < 40: Weak financials
    expect(getLabelForScore(39, 100).label).toBe('Weak financials');
    expect(getLabelForScore(15, 100).label).toBe('Weak financials');

    // < 70% completeness: Not enough data
    expect(getLabelForScore(85, 60).label).toBe('Not enough data');
    expect(getLabelForScore(null, 50).label).toBe('Not enough data');
  });

  it('computes full analysis for standard industrial company (e.g. TCS.NS)', () => {
    const analysis = computeFinancialAnalysis({
      symbol: 'TCS.NS',
      name: 'Tata Consultancy Services Limited',
      companyType: 'standard',
      fiscalPeriod: 'FY2025',
      roe: 0.45, // very strong
      operatingMargin: 0.25, // strong (>20%)
      revenueCAGR3Y: 0.12, // healthy
      epsCAGR3Y: 0.11, // healthy
      cfoToNetProfit: 1.12, // strong cash conversion
      fcfMargin: 0.19, // strong
      debtToEquity: 0.05, // virtually zero debt
      interestCoverage: 50.0, // immense coverage
      netDebtToEbitda: 0.1, // low net debt
      peRatio: 28.5
    });

    expect(analysis.symbol).toBe('TCS.NS');
    expect(analysis.companyType).toBe('standard');
    expect(analysis.completeness).toBe(100);
    expect(analysis.score).toBeGreaterThanOrEqual(65);
    expect(analysis.label).toBe('Strong financials');
    expect(analysis.pillars).toHaveLength(5);
    expect(analysis.narrative.length).toBeGreaterThanOrEqual(3);

    // Verify all narrative sentences are strictly compliant
    const check = validateNarrativeText(analysis.narrative);
    expect(check.valid).toBe(true);
    expect(check.violations).toHaveLength(0);
  });

  it('computes full analysis for banking institution (e.g. HDFCBANK.NS)', () => {
    const analysis = computeFinancialAnalysis({
      symbol: 'HDFCBANK.NS',
      name: 'HDFC Bank Limited',
      companyType: 'bank',
      fiscalPeriod: 'FY2025',
      roe: 0.165,
      roa: 0.019,
      revenueCAGR3Y: 0.18,
      epsCAGR3Y: 0.15,
      capitalAdequacyRatio: 0.188,
      grossNpaRatio: 0.013,
      pbRatio: 2.4
    });

    expect(analysis.symbol).toBe('HDFCBANK.NS');
    expect(analysis.companyType).toBe('bank');
    expect(analysis.completeness).toBe(100);
    expect(analysis.score).toBeGreaterThanOrEqual(65);
    expect(analysis.label).toBe('Strong financials');
    expect(analysis.pillars.some((p) => p.name === 'Capital adequacy')).toBe(true);
    expect(analysis.pillars.some((p) => p.name === 'Asset quality')).toBe(true);

    const check = validateNarrativeText(analysis.narrative);
    expect(check.valid).toBe(true);
  });

  it('strictly validates and rejects any forbidden investment advice words', () => {
    const forbiddenExamples = [
      'We recommend buying this high quality stock.',
      'Target price of 4200 represents significant upside.',
      'Investors should hold their position.',
      'This security is undervalued and guarantees great returns.'
    ];

    const check = validateNarrativeText(forbiddenExamples);
    expect(check.valid).toBe(false);
    expect(check.violations.length).toBeGreaterThanOrEqual(4);
    for (const word of ['buy', 'target', 'upside', 'hold', 'undervalued', 'guarantee']) {
      expect(check.violations.some((v) => v.toLowerCase().includes(word))).toBe(true);
    }
  });
});
