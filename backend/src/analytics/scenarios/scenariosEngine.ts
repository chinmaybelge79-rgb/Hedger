import { ScenarioInput, ScenarioResponse } from '@api/schemas/analytics';
import { calculateDcf } from '@valuation/dcf/dcfEngine';

export async function calculateScenarios(ticker: string, input: ScenarioInput, currentPrice: number): Promise<ScenarioResponse> {
  const { bear, base, bull, weights } = input;

  const [bearResult, baseResult, bullResult] = await Promise.all([
    calculateDcf(ticker, { ...bear, forecastYears: bear.revenueGrowth.length }),
    calculateDcf(ticker, { ...base, forecastYears: base.revenueGrowth.length }),
    calculateDcf(ticker, { ...bull, forecastYears: bull.revenueGrowth.length }),
  ]);

  const weightedValue = bearResult.fairValuePerShare * weights.bear + baseResult.fairValuePerShare * weights.base + bullResult.fairValuePerShare * weights.bull;

  return {
    bear: { fairValue: bearResult.fairValuePerShare, upside: currentPrice > 0 ? (bearResult.fairValuePerShare - currentPrice) / currentPrice : 0 },
    base: { fairValue: baseResult.fairValuePerShare, upside: currentPrice > 0 ? (baseResult.fairValuePerShare - currentPrice) / currentPrice : 0 },
    bull: { fairValue: bullResult.fairValuePerShare, upside: currentPrice > 0 ? (bullResult.fairValuePerShare - currentPrice) / currentPrice : 0 },
    weightedValue,
  };
}