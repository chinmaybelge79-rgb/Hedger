import { describe, it, expect } from 'vitest';
import { calculateSotp } from '../../src/valuation/sotp/sotpEngine';
import { calculateDdm } from '../../src/valuation/ddm/ddmEngine';
import { calculateResidualIncome } from '../../src/valuation/residual-income/residualIncomeEngine';
import { calculateEva } from '../../src/valuation/eva/evaEngine';

describe('SOTP engine', () => {
  it('sums segment EVs and derives per-share value', async () => {
    const result = await calculateSotp('MSFT', {
      segments: [
        { name: 'Cloud', revenue: 100, ebitda: 50, multiple: 12 },
        { name: 'Office', revenue: 80, ebitda: 40, multiple: 8 },
      ],
      netDebt: 100,
      investments: 50,
      sharesOutstanding: 10,
    });

    expect(result.totalEV).toBeCloseTo(920);
    expect(result.equityValue).toBeCloseTo(870);
    expect(result.fairValuePerShare).toBeCloseTo(87);
  });

  it('computes upside against current price', async () => {
    const result = await calculateSotp('MSFT', {
      segments: [{ name: 'Only', revenue: 10, ebitda: 10, multiple: 41.234 }],
      netDebt: 0,
      investments: 0,
      sharesOutstanding: 1,
    });

    expect(result.currentPrice).toBeGreaterThan(0);
    const expected = (result.fairValuePerShare - result.currentPrice) / result.currentPrice;
    expect(result.upside).toBeCloseTo(expected);
  });

  it('throws 404 for unknown ticker', async () => {
    await expect(calculateSotp('ZZZZ', {
      segments: [{ name: 'X', revenue: 1, ebitda: 1, multiple: 1 }],
      sharesOutstanding: 1,
    })).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('DDM engine', () => {
  const base = {
    model: 'gordon' as const,
    currentDividend: 2,
    growthRate: 0.05,
    terminalGrowth: 0.025,
    costOfEquity: 0.09,
    sharesOutstanding: 1000,
  };

  it('computes Gordon growth value', async () => {
    const result = await calculateDdm('MSFT', base);
    const expected = (2 * 1.025) / (0.09 - 0.025);
    expect(result.fairValuePerShare).toBeCloseTo(expected, 4);
  });

  it('computes two-stage value', async () => {
    const result = await calculateDdm('MSFT', { ...base, model: 'two-stage', highGrowthYears: 5 });
    expect(result.fairValuePerShare).toBeGreaterThan(0);
    // High-growth dividends must contribute positive PV
    const gordon = await calculateDdm('MSFT', base);
    expect(result.fairValuePerShare).toBeGreaterThan(gordon.fairValuePerShare);
  });

  it('computes three-stage value', async () => {
    const result = await calculateDdm('MSFT', { ...base, model: 'three-stage', highGrowthYears: 3 });
    expect(result.fairValuePerShare).toBeGreaterThan(0);
  });

  it('rejects terminal growth >= cost of equity', async () => {
    await expect(calculateDdm('MSFT', { ...base, costOfEquity: 0.025 }))
      .rejects.toThrow(/greater than terminal growth/i);
  });

  it('throws 404 for unknown ticker', async () => {
    await expect(calculateDdm('ZZZZ', base)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('Residual income engine', () => {
  it('values book value plus PV of residual income', async () => {
    const result = await calculateResidualIncome('MSFT', {
      bookValuePerShare: 25,
      costOfEquity: 0.09,
      forecastYears: 2,
      roe: [0.3, 0.3],
      payoutRatio: 0.3,
      terminalGrowth: 0.025,
      sharesOutstanding: 1000,
    });

    expect(result.bookValuePerShare).toBeCloseTo(25);
    expect(result.forecast).toHaveLength(2);
    expect(result.forecast[0].beginningBV).toBeCloseTo(25);
    expect(result.forecast[0].netIncome).toBeCloseTo(7.5);
    expect(result.forecast[0].residualIncome).toBeCloseTo(7.5 - 25 * 0.09);
    expect(result.fairValuePerShare).toBeCloseTo(25 + result.presentValueRi, 6);
    expect(result.fairValuePerShare).toBeGreaterThan(25);
  });

  it('compounds book value with retained earnings', async () => {
    const result = await calculateResidualIncome('MSFT', {
      bookValuePerShare: 100,
      costOfEquity: 0.1,
      forecastYears: 1,
      roe: [0.2],
      payoutRatio: 0.5,
      terminalGrowth: 0.02,
      sharesOutstanding: 1,
    });

    expect(result.forecast[0].netIncome).toBeCloseTo(20);
    expect(result.forecast[0].endingBV).toBeCloseTo(110);
  });

  it('throws 404 for unknown ticker', async () => {
    await expect(calculateResidualIncome('ZZZZ', {
      bookValuePerShare: 10,
      costOfEquity: 0.09,
      roe: [0.2],
      sharesOutstanding: 1,
    })).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('EVA engine', () => {
  it('values invested capital plus PV of EVA', async () => {
    const result = await calculateEva('MSFT', {
      wacc: 0.1,
      forecastYears: 2,
      nopat: [15, 15],
      investedCapital: [100, 100],
      terminalGrowth: 0.0,
      currentInvestedCapital: 100,
      sharesOutstanding: 10,
    });

    expect(result.currentEVA).toBeCloseTo(5);
    expect(result.forecast).toHaveLength(2);
    expect(result.forecast[0].capitalCharge).toBeCloseTo(10);
    expect(result.forecast[0].eva).toBeCloseTo(5);
    expect(result.fairValuePerShare).toBeCloseTo((100 + result.presentValueEVA) / 10, 6);
  });

  it('charges capital at wacc each year', async () => {
    const result = await calculateEva('MSFT', {
      wacc: 0.08,
      forecastYears: 1,
      nopat: [20],
      investedCapital: [150],
      terminalGrowth: 0.02,
      currentInvestedCapital: 150,
      sharesOutstanding: 1,
    });

    expect(result.forecast[0].capitalCharge).toBeCloseTo(12);
    expect(result.forecast[0].eva).toBeCloseTo(8);
  });

  it('throws 404 for unknown ticker', async () => {
    await expect(calculateEva('ZZZZ', {
      wacc: 0.08,
      forecastYears: 1,
      nopat: [10],
      investedCapital: [100],
      currentInvestedCapital: 100,
      sharesOutstanding: 1,
    })).rejects.toMatchObject({ statusCode: 404 });
  });
});
