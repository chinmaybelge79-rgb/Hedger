import { ReverseDcfInput, ReverseDcfResponse } from '@api/schemas/valuation';
import { calculateDcf } from '../dcf/dcfEngine';
import { logger } from '@config/logger';

async function binarySearchAsync(
  fn: (x: number) => Promise<number>,
  target: number,
  low: number,
  high: number,
  tolerance: number = 1e-6,
  maxIterations: number = 50
): Promise<number> {
  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;
    const value = await fn(mid);
    if (Math.abs(value - target) < tolerance) {
      return mid;
    }
    if (value < target) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

export async function calculateReverseDcf(
  ticker: string,
  input: ReverseDcfInput
): Promise<ReverseDcfResponse> {
  const { currentPrice, wacc, terminalGrowth, sharesOutstanding, netDebt, cash } = input;

  const baseCase = await calculateDcf(ticker, {
    forecastYears: 5,
    revenueGrowth: [0.05, 0.05, 0.05, 0.05, 0.05],
    ebitMargin: [0.2, 0.2, 0.2, 0.2, 0.2],
    taxRate: 0.21,
    wacc,
    terminalGrowth,
    sharesOutstanding,
    netDebt,
    cash,
  }, currentPrice);

  const baseFairValue = baseCase.fairValuePerShare;

  if (Math.abs(baseFairValue - currentPrice) / currentPrice < 0.01) {
    return {
      impliedRevenueGrowth: 0.05,
      impliedTerminalMargin: 0.2,
      impliedFcfGrowth: 0.05,
      interpretation: 'Current price is close to base case DCF fair value.',
    };
  }

  const impliedRevenueGrowth = await binarySearchAsync(
    async (growth) => {
      const result = await calculateDcf(ticker, {
        forecastYears: 5,
        revenueGrowth: Array(5).fill(growth),
        ebitMargin: [0.2, 0.2, 0.2, 0.2, 0.2],
        taxRate: 0.21,
        wacc,
        terminalGrowth,
        sharesOutstanding,
        netDebt,
        cash,
      }, currentPrice);
      return result.fairValuePerShare;
    },
    currentPrice,
    -0.5,
    1.0
  );

  const impliedTerminalMargin = await binarySearchAsync(
    async (margin) => {
      const result = await calculateDcf(ticker, {
        forecastYears: 5,
        revenueGrowth: [0.05, 0.05, 0.05, 0.05, 0.05],
        ebitMargin: Array(5).fill(margin),
        taxRate: 0.21,
        wacc,
        terminalGrowth,
        sharesOutstanding,
        netDebt,
        cash,
      }, currentPrice);
      return result.fairValuePerShare;
    },
    currentPrice,
    0.01,
    0.6
  );

  const impliedFcfGrowth = await binarySearchAsync(
    async (growth) => {
      const result = await calculateDcf(ticker, {
        forecastYears: 5,
        revenueGrowth: Array(5).fill(growth),
        ebitMargin: Array(5).fill(0.2 * (1 + growth)),
        taxRate: 0.21,
        wacc,
        terminalGrowth,
        sharesOutstanding,
        netDebt,
        cash,
      }, currentPrice);
      return result.fairValuePerShare;
    },
    currentPrice,
    -0.2,
    0.5
  );

  let interpretation = '';
  if (impliedRevenueGrowth > 0.15) {
    interpretation = 'Market price implies exceptionally high long-term growth expectations.';
  } else if (impliedRevenueGrowth > 0.1) {
    interpretation = 'Market price implies elevated long-term growth above historical averages.';
  } else if (impliedRevenueGrowth > 0.05) {
    interpretation = 'Market price implies moderate long-term growth.';
  } else if (impliedRevenueGrowth > 0) {
    interpretation = 'Market price implies low but positive long-term growth.';
  } else {
    interpretation = 'Market price implies declining revenues or significant headwinds.';
  }

  return {
    impliedRevenueGrowth,
    impliedTerminalMargin,
    impliedFcfGrowth,
    interpretation,
  };
}