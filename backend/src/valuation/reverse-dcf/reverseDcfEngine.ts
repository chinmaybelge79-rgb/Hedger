import { ReverseDcfInput, ReverseDcfResponse } from '@api/schemas/valuation';
import { loadDcfBase, runDcfMath, type DcfCompanyBase } from '../dcf/dcfEngine';

/**
 * Synchronous bisection over the pure DCF math core.
 * The function is monotonic in both growth and margin, so bisection is exact.
 */
function binarySearch(
  fn: (x: number) => number,
  target: number,
  low: number,
  high: number,
  tolerance: number = 1e-4,
  maxIterations: number = 60
): number {
  let lo = low;
  let hi = high;
  for (let i = 0; i < maxIterations; i++) {
    const mid = (lo + hi) / 2;
    const value = fn(mid);
    if (Math.abs(value - target) < tolerance * Math.max(1, Math.abs(target))) {
      return mid;
    }
    if (value < target) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

export async function calculateReverseDcf(
  ticker: string,
  input: ReverseDcfInput
): Promise<ReverseDcfResponse> {
  const { currentPrice, wacc, terminalGrowth, sharesOutstanding, netDebt, cash } = input;

  const base = await loadDcfBase(ticker, {
    sharesOutstanding,
    netDebt,
    cash,
    currentPrice,
  });

  if (currentPrice <= 0) {
    throw new Error('Current price must be positive for reverse DCF');
  }

  const dcfFor = (growth: number[], margin: number[]) =>
    runDcfMath(base, {
      forecastYears: 5,
      revenueGrowth: growth,
      ebitMargin: margin,
      taxRate: 0.21,
      wacc,
      terminalGrowth,
    }).fairValuePerShare;

  const baseFairValue = dcfFor([0.05, 0.05, 0.05, 0.05, 0.05], [0.2, 0.2, 0.2, 0.2, 0.2]);

  if (Math.abs(baseFairValue - currentPrice) / currentPrice < 0.01) {
    return {
      impliedRevenueGrowth: 0.05,
      impliedTerminalMargin: 0.2,
      impliedFcfGrowth: 0.05,
      interpretation: 'Current price is close to base case DCF fair value.',
    };
  }

  // 1. Growth required to justify price
  const impliedRevenueGrowth = binarySearch(
    (growth) => dcfFor(Array(5).fill(growth), [0.2, 0.2, 0.2, 0.2, 0.2]),
    currentPrice,
    -0.5,
    1.0
  );

  // 2. Terminal EBIT margin required to justify price
  const impliedTerminalMargin = binarySearch(
    (margin) => dcfFor([0.05, 0.05, 0.05, 0.05, 0.05], Array(5).fill(margin)),
    currentPrice,
    0.01,
    0.6
  );

  // 3. Combined FCF trajectory growth
  const impliedFcfGrowth = binarySearch(
    (growth) => dcfFor(Array(5).fill(growth), Array(5).fill(0.2 * (1 + growth))),
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
