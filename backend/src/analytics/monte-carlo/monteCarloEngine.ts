import { MonteCarloInput, MonteCarloResponse } from '@api/schemas/analytics';
import { calculateDcf } from '@valuation/dcf/dcfEngine';

function sampleNormal(mean: number, stdDev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdDev;
}

export async function calculateMonteCarlo(ticker: string, input: MonteCarloInput): Promise<MonteCarloResponse> {
  const { iterations, variables, baseInputs } = input;
  const currentPrice = 0; // Will be fetched inside calculateDcf

  const results: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const revenueGrowth = Array(baseInputs.forecastYears).fill(0).map(() => sampleNormal(variables.revenueGrowth.mean, variables.revenueGrowth.stdDev));
    const ebitMargin = Array(baseInputs.forecastYears).fill(0).map(() => sampleNormal(variables.ebitMargin.mean, variables.ebitMargin.stdDev));
    const wacc = sampleNormal(variables.wacc.mean, variables.wacc.stdDev);
    const terminalGrowth = sampleNormal(variables.terminalGrowth.mean, variables.terminalGrowth.stdDev);

    try {
      const result = await calculateDcf(ticker, {
        forecastYears: baseInputs.forecastYears,
        revenueGrowth,
        ebitMargin,
        taxRate: baseInputs.taxRate,
        wacc: Math.max(0.01, Math.min(0.3, wacc)),
        terminalGrowth: Math.max(0, Math.min(0.1, terminalGrowth)),
        sharesOutstanding: baseInputs.sharesOutstanding,
        netDebt: baseInputs.netDebt,
        cash: baseInputs.cash,
      }, currentPrice);

      if (result.fairValuePerShare > 0 && isFinite(result.fairValuePerShare)) {
        results.push(result.fairValuePerShare);
      }
    } catch {
      // Skip failed iterations
    }
  }

  if (results.length === 0) {
    throw new Error('All Monte Carlo iterations failed');
  }

  results.sort((a, b) => a - b);

  const mean = results.reduce((a, b) => a + b, 0) / results.length;
  const median = results[Math.floor(results.length / 2)];
  const p10 = results[Math.floor(results.length * 0.1)];
  const p25 = results[Math.floor(results.length * 0.25)];
  const p75 = results[Math.floor(results.length * 0.75)];
  const p90 = results[Math.floor(results.length * 0.9)];

  const min = results[0];
  const max = results[results.length - 1];
  const binCount = 20;
  const binSize = (max - min) / binCount;
  const distribution: { value: number; count: number }[] = [];

  for (let i = 0; i < binCount; i++) {
    const binMin = min + i * binSize;
    const binMax = min + (i + 1) * binSize;
    const count = results.filter(v => v >= binMin && v < (i === binCount - 1 ? binMax + 1 : binMax)).length;
    distribution.push({ value: (binMin + binMax) / 2, count });
  }

  return {
    iterations: results.length,
    mean,
    median,
    p10,
    p25,
    p75,
    p90,
    distribution,
  };
}