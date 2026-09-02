import { ScenarioInput, ScenarioResponse } from '@api/schemas/analytics';
import { calculateDcf } from '@valuation/dcf/dcfEngine';

export async function calculateScenarios(ticker: string, input: ScenarioInput, currentPrice: number): Promise<ScenarioResponse> {
  const { bear, base, bull, weights } = input;

  const [bearResult, baseResult, bullResult] = await Promise.all([
    calculateDcf(ticker, { ...bear, forecastYears: bear.revenueGrowth.length }),
    calculateDcf(ticker, { ...base, forecastYears: base.revenueGrowth.length }),
    calculateDcf(ticker, { ...bull, forecastYears: bull.revenueGrowth.length }),
  ]);

  // Normalize weights so arbitrary user weights produce a true weighted average
  const totalWeight = weights.bear + weights.base + weights.bull;
  const w = totalWeight > 0 ? { bear: weights.bear / totalWeight, base: weights.base / totalWeight, bull: weights.bull / totalWeight } : { bear: 1 / 3, base: 1 / 3, bull: 1 / 3 };

  const weightedValue =
    bearResult.fairValuePerShare * w.bear +
    baseResult.fairValuePerShare * w.base +
    bullResult.fairValuePerShare * w.bull;

  const upside = (fv: number) => (currentPrice > 0 ? (fv - currentPrice) / currentPrice : 0);

  return {
    bear: { fairValue: bearResult.fairValuePerShare, upside: upside(bearResult.fairValuePerShare) },
    base: { fairValue: baseResult.fairValuePerShare, upside: upside(baseResult.fairValuePerShare) },
    bull: { fairValue: bullResult.fairValuePerShare, upside: upside(bullResult.fairValuePerShare) },
    weightedValue,
  };
}
