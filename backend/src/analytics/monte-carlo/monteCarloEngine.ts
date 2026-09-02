import { MonteCarloInput, MonteCarloResponse } from '@api/schemas/analytics';
import { loadDcfBase, runDcfMath } from '@valuation/dcf/dcfEngine';

/** Box-Muller transform: one normal sample per call. */
function sampleNormal(mean: number, stdDev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdDev;
}

export async function calculateMonteCarlo(ticker: string, input: MonteCarloInput): Promise<MonteCarloResponse> {
  const { iterations, variables, baseInputs } = input;

  // Load fundamentals exactly once; iterate over pure math
  const base = await loadDcfBase(ticker, {
    sharesOutstanding: baseInputs.sharesOutstanding,
    netDebt: baseInputs.netDebt,
    cash: baseInputs.cash,
  });

  const results: number[] = [];
  const years = baseInputs.forecastYears;

  for (let i = 0; i < iterations; i++) {
    const revenueGrowth = Array.from({ length: years }, () =>
      sampleNormal(variables.revenueGrowth.mean, variables.revenueGrowth.stdDev));
    const ebitMargin = Array.from({ length: years }, () =>
      sampleNormal(variables.ebitMargin.mean, variables.ebitMargin.stdDev));
    const wacc = Math.max(0.01, Math.min(0.3, sampleNormal(variables.wacc.mean, variables.wacc.stdDev)));
    const terminalGrowth = Math.max(0, Math.min(0.1, sampleNormal(variables.terminalGrowth.mean, variables.terminalGrowth.stdDev)));

    try {
      const result = runDcfMath(base, {
        forecastYears: years,
        revenueGrowth,
        ebitMargin,
        taxRate: baseInputs.taxRate,
        wacc,
        terminalGrowth,
      });
      if (result.fairValuePerShare > 0 && isFinite(result.fairValuePerShare)) {
        results.push(result.fairValuePerShare);
      }
    } catch {
      // Skip invalid iterations (e.g., wacc <= terminal growth after clamping)
    }
  }

  if (results.length === 0) {
    throw new Error('All Monte Carlo iterations failed');
  }

  results.sort((a, b) => a - b);

  const n = results.length;
  const mean = results.reduce((a, b) => a + b, 0) / n;
  const median = results[Math.floor(n / 2)];
  const percentile = (p: number) => results[Math.min(n - 1, Math.floor(n * p))];
  const p10 = percentile(0.1);
  const p25 = percentile(0.25);
  const p75 = percentile(0.75);
  const p90 = percentile(0.9);

  // Single-pass histogram: O(n) instead of O(n * bins)
  const min = results[0];
  const max = results[n - 1];
  const binCount = 20;
  const binSize = (max - min) / binCount || 1;
  const counts = new Array<number>(binCount).fill(0);

  for (const v of results) {
    let idx = Math.floor((v - min) / binSize);
    if (idx >= binCount) idx = binCount - 1; // include max in last bin
    counts[idx]++;
  }

  const distribution = counts.map((count, i) => ({
    value: min + (i + 0.5) * binSize,
    count,
  }));

  return {
    iterations: n,
    mean,
    median,
    p10,
    p25,
    p75,
    p90,
    distribution,
  };
}
