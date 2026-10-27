/**
 * Capital Structure Optimizer & WACC Builder
 *
 * Implements:
 * 1. Synthetic Credit Rating Estimator (Damodaran Interest Coverage tables)
 * 2. Interactive Hamada Unlevering/Relevering Formula
 * 3. Debt-Capacity & WACC Curve Simulator (finding the optimal debt-to-capital ratio)
 */

export interface SyntheticRatingTier {
  minCoverage: number;
  maxCoverage: number;
  rating: string;
  defaultSpreadPercent: number; // in percentage e.g. 1.25%
}

export const LARGE_CAP_SYNTHETIC_RATINGS: SyntheticRatingTier[] = [
  { minCoverage: 8.5, maxCoverage: Infinity, rating: 'AAA', defaultSpreadPercent: 0.55 },
  { minCoverage: 6.5, maxCoverage: 8.5, rating: 'AA', defaultSpreadPercent: 0.80 },
  { minCoverage: 5.5, maxCoverage: 6.5, rating: 'A+', defaultSpreadPercent: 1.10 },
  { minCoverage: 4.25, maxCoverage: 5.5, rating: 'A', defaultSpreadPercent: 1.25 },
  { minCoverage: 3.0, maxCoverage: 4.25, rating: 'A-', defaultSpreadPercent: 1.50 },
  { minCoverage: 2.5, maxCoverage: 3.0, rating: 'BBB', defaultSpreadPercent: 1.75 },
  { minCoverage: 2.0, maxCoverage: 2.5, rating: 'BB+', defaultSpreadPercent: 2.50 },
  { minCoverage: 1.75, maxCoverage: 2.0, rating: 'BB', defaultSpreadPercent: 3.00 },
  { minCoverage: 1.5, maxCoverage: 1.75, rating: 'B+', defaultSpreadPercent: 3.75 },
  { minCoverage: 1.25, maxCoverage: 1.5, rating: 'B', defaultSpreadPercent: 4.50 },
  { minCoverage: 0.8, maxCoverage: 1.25, rating: 'B-', defaultSpreadPercent: 5.50 },
  { minCoverage: 0.65, maxCoverage: 0.8, rating: 'CCC', defaultSpreadPercent: 8.00 },
  { minCoverage: -Infinity, maxCoverage: 0.65, rating: 'D', defaultSpreadPercent: 12.00 }
];

export function estimateSyntheticCreditRating(interestCoverageRatio: number): {
  rating: string;
  defaultSpreadPercent: number;
  coverageRatio: number;
} {
  const match = LARGE_CAP_SYNTHETIC_RATINGS.find(
    tier => interestCoverageRatio >= tier.minCoverage && interestCoverageRatio < tier.maxCoverage
  ) || LARGE_CAP_SYNTHETIC_RATINGS[LARGE_CAP_SYNTHETIC_RATINGS.length - 1]!;

  return {
    rating: match.rating,
    defaultSpreadPercent: match.defaultSpreadPercent,
    coverageRatio: interestCoverageRatio
  };
}

/**
 * Hamada Unlevered Beta via Debt-to-Equity ratio
 * betaU = betaL / (1 + (1 - taxRate) * (debt / equity))
 */
export function unleverBetaRatio(leveredBeta: number, taxRate: number, debtToEquity: number): number {
  const divisor = 1 + (1 - taxRate) * debtToEquity;
  return divisor > 0 ? Number((leveredBeta / divisor).toFixed(4)) : leveredBeta;
}

/**
 * Hamada Relevered Beta via Debt-to-Equity ratio
 * betaL = betaU * (1 + (1 - taxRate) * (debt / equity))
 */
export function releverBetaRatio(unleveredBeta: number, taxRate: number, debtToEquity: number): number {
  return Number((unleveredBeta * (1 + (1 - taxRate) * debtToEquity)).toFixed(4));
}

export interface CapitalStructurePoint {
  debtRatio: number; // e.g. 0.20 for 20%
  debtToEquity: number;
  syntheticRating: string;
  defaultSpread: number; // in %
  preTaxCostOfDebt: number; // in %
  afterTaxCostOfDebt: number; // in %
  releveredBeta: number;
  costOfEquity: number; // in %
  wacc: number; // in %
  enterpriseValue: number;
}

export interface CapitalStructureOptimizationResult {
  currentDebtRatio: number;
  currentWACC: number;
  optimalDebtRatio: number;
  optimalWACC: number;
  unleveredBeta: number;
  riskFreeRate: number;
  equityRiskPremium: number;
  taxRate: number;
  points: CapitalStructurePoint[];
}

export function optimizeCapitalStructure(params: {
  ebit: number;
  enterpriseValue: number;
  currentDebt: number;
  unleveredBeta: number;
  riskFreeRate: number; // e.g. 4.2 for 4.2%
  equityRiskPremium: number; // e.g. 5.0 for 5.0%
  taxRate: number; // e.g. 0.25 for 25%
  baseFreeCashFlow?: number;
  terminalGrowthRate?: number; // e.g. 2.5 for 2.5%
}): CapitalStructureOptimizationResult {
  const {
    ebit,
    enterpriseValue,
    currentDebt,
    unleveredBeta,
    riskFreeRate,
    equityRiskPremium,
    taxRate,
    baseFreeCashFlow = ebit * 0.7,
    terminalGrowthRate = 2.5
  } = params;

  const currentDebtRatio = enterpriseValue > 0 ? Math.min(0.9, currentDebt / enterpriseValue) : 0.15;
  const debtRatios = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

  let optimalWACC = Infinity;
  let optimalDebtRatio = 0.0;

  const points: CapitalStructurePoint[] = debtRatios.map(dRatio => {
    const eRatio = 1 - dRatio;
    const debtToEquity = eRatio > 0.01 ? dRatio / eRatio : 99.0;
    const imputedDebt = enterpriseValue * dRatio;

    // Estimate interest expense at initial trial rate (rf + 1.5%)
    const trialInterest = imputedDebt * ((riskFreeRate + 1.5) / 100);
    const coverage = trialInterest > 0 ? ebit / trialInterest : 999.0;

    const ratingInfo = estimateSyntheticCreditRating(coverage);
    const preTaxKd = riskFreeRate + ratingInfo.defaultSpreadPercent;
    const afterTaxKd = preTaxKd * (1 - taxRate);

    const bL = releverBetaRatio(unleveredBeta, taxRate, debtToEquity);
    const ke = riskFreeRate + bL * equityRiskPremium;

    const waccVal = dRatio * afterTaxKd + eRatio * ke;

    // Implied Enterprise Value: FCFF * (1 + g) / (WACC - g)
    const gDecimal = terminalGrowthRate / 100;
    const waccDecimal = waccVal / 100;
    const evVal = waccDecimal > gDecimal
      ? (baseFreeCashFlow * (1 + gDecimal)) / (waccDecimal - gDecimal)
      : enterpriseValue;

    if (waccVal < optimalWACC) {
      optimalWACC = waccVal;
      optimalDebtRatio = dRatio;
    }

    return {
      debtRatio: dRatio,
      debtToEquity: Number(debtToEquity.toFixed(3)),
      syntheticRating: ratingInfo.rating,
      defaultSpread: ratingInfo.defaultSpreadPercent,
      preTaxCostOfDebt: Number(preTaxKd.toFixed(2)),
      afterTaxCostOfDebt: Number(afterTaxKd.toFixed(2)),
      releveredBeta: bL,
      costOfEquity: Number(ke.toFixed(2)),
      wacc: Number(waccVal.toFixed(2)),
      enterpriseValue: Math.round(evVal)
    };
  });

  // Calculate current WACC
  const currentPoint = points.reduce((prev, curr) =>
    Math.abs(curr.debtRatio - currentDebtRatio) < Math.abs(prev.debtRatio - currentDebtRatio) ? curr : prev
  );

  return {
    currentDebtRatio: Number(currentDebtRatio.toFixed(2)),
    currentWACC: currentPoint.wacc,
    optimalDebtRatio: Number(optimalDebtRatio.toFixed(2)),
    optimalWACC: Number(optimalWACC.toFixed(2)),
    unleveredBeta,
    riskFreeRate,
    equityRiskPremium,
    taxRate,
    points
  };
}
