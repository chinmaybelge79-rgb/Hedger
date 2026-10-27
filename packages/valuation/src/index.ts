import type {
  DCFInputs,
  DCFOutput,
  ProjectedYear,
  SensitivityCell,
  ValuationTriangulation,
  MonteCarloResult,
  MonteCarloHistogramBin
} from '@hedger/types';

export interface ValuationEngineOptions {
  inputs: DCFInputs;
  currentPrice: number;
}

// ============================================================================
// MODULE 4 HELPER: HAMADA EQUATION (DYNAMIC BETA RE-LEVERING)
// ============================================================================
/**
 * Un-levers historical equity beta to isolate pure business risk:
 * Beta_U = Beta_L / [1 + (1 - TaxRate) * (Debt / Equity)]
 */
export function unleverBeta(leveredBeta: number, debt: number, equity: number, taxRate: number): number {
  if (equity <= 0 || debt <= 0) return leveredBeta;
  const deRatio = debt / equity;
  return leveredBeta / (1 + (1 - taxRate) * deRatio);
}

/**
 * Re-levers pure business beta for target/shifting capital structure:
 * Beta_L = Beta_U * [1 + (1 - TaxRate) * (Debt / Equity)]
 */
export function calculateHamadaBeta(unleveredBeta: number, debt: number, equity: number, taxRate: number): number {
  if (equity <= 0 || debt <= 0) return unleveredBeta;
  const deRatio = debt / equity;
  return unleveredBeta * (1 + (1 - taxRate) * deRatio);
}

// ============================================================================
// MODULE 4 HELPER: SYNTHETIC CREDIT RATINGS & COST OF DEBT
// ============================================================================
export interface SyntheticRatingResult {
  rating: string;
  spread: number;
  costOfDebt: number;
}

/**
 * Maps Interest Coverage Ratio (EBIT / Interest Expense) to a synthetic credit rating
 * and corporate credit spread over the risk-free benchmark yield.
 */
export function getSyntheticRatingAndCostOfDebt(
  ebit: number,
  interestExpense: number,
  riskFreeRate: number
): SyntheticRatingResult {
  const coverage = interestExpense > 0 ? ebit / interestExpense : 15.0;

  if (coverage > 8.5) {
    return { rating: 'AAA', spread: 0.006, costOfDebt: riskFreeRate + 0.006 };
  } else if (coverage > 6.5) {
    return { rating: 'AA', spread: 0.0085, costOfDebt: riskFreeRate + 0.0085 };
  } else if (coverage > 4.5) {
    return { rating: 'A', spread: 0.0115, costOfDebt: riskFreeRate + 0.0115 };
  } else if (coverage > 3.0) {
    return { rating: 'BBB', spread: 0.016, costOfDebt: riskFreeRate + 0.016 };
  } else if (coverage > 2.0) {
    return { rating: 'BB', spread: 0.025, costOfDebt: riskFreeRate + 0.025 };
  } else if (coverage > 1.5) {
    return { rating: 'B', spread: 0.035, costOfDebt: riskFreeRate + 0.035 };
  } else {
    return { rating: 'CCC / Distressed', spread: 0.060, costOfDebt: riskFreeRate + 0.060 };
  }
}

// ============================================================================
// MODULE 1: 10-YEAR MULTI-PHASE REVENUE GROWTH TRAJECTORY
// ============================================================================
/**
 * Constructs a 10-Year Revenue Growth Trajectory:
 * • Phase 1 (Years 1–3): Near-Term High Growth (backlog / TAM expansion)
 * • Phase 2 (Years 4–7): Linear Transition & Deceleration towards GDP rate
 * • Phase 3 (Years 8–10): Mature Equilibrium at Terminal Growth (2%–4%)
 */
export function build10YearGrowthTrajectory(
  nearTermGrowth: number,
  terminalGrowth: number,
  customRates?: number[]
): number[] {
  if (customRates && customRates.length >= 10) {
    return customRates.slice(0, 10);
  }

  const rates: number[] = [];
  const gNear = nearTermGrowth;
  const gTerm = terminalGrowth;

  for (let year = 1; year <= 10; year++) {
    if (year <= 3) {
      // Phase 1: High growth
      rates.push(gNear);
    } else if (year <= 7) {
      // Phase 2: Deceleration (linear fade over 4 years)
      const fadeStep = (year - 3) / (7 - 3);
      const rate = gNear - (gNear - gTerm) * fadeStep;
      rates.push(rate);
    } else {
      // Phase 3: Mature equilibrium
      rates.push(gTerm);
    }
  }

  return rates;
}

// ============================================================================
// GENERALIZED 10-YEAR DISCOUNTED CASH FLOW ENGINE
// ============================================================================
/**
 * Calculates a generalized 10-Year Unlevered Free Cash Flow (UFCF) valuation
 * across the 5 core modules:
 * 1. Revenue Projection (Phase 1-3)
 * 2. Operating Expenses & Margin Convergence (Gross Margin & Operating Leverage)
 * 3. Unlevered Free Cash Flow (UFCF = EBIT*(1-T) + D&A - CapEx - Delta NWC)
 * 4. WACC & Capital Structure (CAPM, Hamada Beta, Synthetic Debt Spread)
 * 5. Terminal Value & Equity Value Bridge (Gordon Growth, Exit Multiple, Cash/Debt/Shares)
 */
// ============================================================================
// WACC & CAPITAL STRUCTURE RESOLUTION
// ============================================================================
export function resolveWACC(inputs: Partial<DCFInputs>, currentPrice: number = 0) {
  const taxRate = inputs.taxRate ?? 0.25;
  const currentRevenue = inputs.currentRevenue ?? 1000;
  const operatingMargin = inputs.operatingMargin ?? 0.20;
  const sharesOutstanding = inputs.sharesOutstanding ?? 100;
  const totalDebt = inputs.totalDebt ?? 0;
  const providedCostOfDebt = inputs.costOfDebt ?? 0.065;
  const riskFreeRate = inputs.riskFreeRate ?? 0.042;
  const beta = inputs.beta ?? 1.10;
  const equityRiskPremium = inputs.equityRiskPremium ?? 0.055;
  const userWacc = inputs.wacc ?? 0;

  const estimatedMarketEquity = currentPrice > 0 && sharesOutstanding > 0
    ? currentPrice * sharesOutstanding
    : currentRevenue * 1.5;
  const totalCapital = Math.max(1, estimatedMarketEquity + totalDebt);
  const equityWeight = estimatedMarketEquity / totalCapital;
  const debtWeight = totalDebt / totalCapital;

  const unlevBeta = inputs.unleveredBeta ?? unleverBeta(beta, totalDebt, estimatedMarketEquity, taxRate);
  const leveredBeta = calculateHamadaBeta(unlevBeta, totalDebt, estimatedMarketEquity, taxRate);
  const costOfEquity = riskFreeRate + leveredBeta * equityRiskPremium;

  const approxInterest = totalDebt * providedCostOfDebt;
  const approxEbit = currentRevenue * operatingMargin;
  const synthetic = getSyntheticRatingAndCostOfDebt(approxEbit, approxInterest, riskFreeRate);
  const finalCostOfDebt = providedCostOfDebt > 0 ? providedCostOfDebt : synthetic.costOfDebt;
  const afterTaxCostOfDebt = finalCostOfDebt * (1 - taxRate);

  const calculatedWacc = equityWeight * costOfEquity + debtWeight * afterTaxCostOfDebt;
  const finalWacc = userWacc > 0 ? userWacc : calculatedWacc;

  return {
    finalWacc,
    costOfEquity,
    finalCostOfDebt,
    afterTaxCostOfDebt,
    equityWeight,
    debtWeight,
    unleveredBeta: unlevBeta,
    leveredBeta,
    synthetic
  };
}

/**
 * Core DCF Calculation Engine.
 * Computes projections, explicit UFCF cash flows, terminal value, and equity bridge
 * without mutual recursion into triangulation or Monte Carlo.
 */
export function calculateCoreDCF(
  inputs: DCFInputs,
  currentPrice: number = 0,
  overrideWacc?: number,
  overrideG?: number,
  overrideHorizon?: number
) {
  const {
    currentRevenue,
    revenueGrowthRates = [0.12, 0.10, 0.08, 0.06, 0.04],
    nearTermGrowthRate,
    operatingMargin,
    baseGrossMargin = Math.min(0.85, Math.max(0.20, operatingMargin + 0.20)),
    targetGrossMargin = Math.min(0.88, Math.max(baseGrossMargin, baseGrossMargin + 0.03)),
    baseOperatingMargin = operatingMargin,
    targetOperatingMargin = operatingMargin,
    taxRate = 0.25,
    daRatio = 0.04,
    capexRatio = 0.05,
    nowcRatio = 0.12,
    baseNowc = currentRevenue * 0.12,
    terminalMethod = 'perpetual_growth',
    exitMultiple = 12.0,
    terminalMultipleWeight = 0.50,
    terminalGrowthRate = 0.035,
    cashAndEquivalents = 0,
    totalDebt = 0,
    preferredStock = 0,
    minorityInterest = 0,
    sharesOutstanding,
    projectionHorizonYears
  } = inputs;

  const isFiveYearLegacy = projectionHorizonYears === 5 ||
    (!projectionHorizonYears && revenueGrowthRates.length === 5 && !nearTermGrowthRate);
  const horizon = overrideHorizon ?? (isFiveYearLegacy ? 5 : (projectionHorizonYears ?? 10));

  const waccResolution = resolveWACC(inputs, currentPrice);
  const finalWacc = overrideWacc !== undefined ? overrideWacc : waccResolution.finalWacc;
  const effectiveTerminalG = overrideG !== undefined ? overrideG : terminalGrowthRate;

  const effectiveNearTermGrowth = nearTermGrowthRate ?? revenueGrowthRates[0] ?? 0.10;
  const trajectory = horizon === 5
    ? revenueGrowthRates.slice(0, 5)
    : build10YearGrowthTrajectory(effectiveNearTermGrowth, effectiveTerminalG, revenueGrowthRates);

  const projections: ProjectedYear[] = [];
  let prevRevenue = currentRevenue;
  let prevNowc = baseNowc;
  let sumPvFcff = 0;

  for (let year = 1; year <= horizon; year++) {
    const growthRate = trajectory[year - 1] ?? effectiveTerminalG;
    const revenue = prevRevenue * (1 + growthRate);

    const phase: 'High Growth' | 'Transition' | 'Mature' =
      year <= 3 ? 'High Growth' : year <= 7 ? 'Transition' : 'Mature';

    const convergenceFactor = horizon === 5 ? (year / 5) : Math.min(1.0, year / 7);
    const grossMargin = baseGrossMargin + (targetGrossMargin - baseGrossMargin) * convergenceFactor;
    const grossProfit = revenue * grossMargin;

    const ebitMargin = baseOperatingMargin + (targetOperatingMargin - baseOperatingMargin) * convergenceFactor;
    const ebit = revenue * ebitMargin;
    const opEx = grossProfit - ebit;

    const operatingTaxes = ebit * taxRate;
    const nopat = ebit - operatingTaxes;
    const da = revenue * daRatio;
    const capex = revenue * capexRatio;

    const nowc = revenue * nowcRatio;
    const changeInNOWC = nowc - prevNowc;

    const ufcf = nopat + da - capex - changeInNOWC;
    const discountFactor = Math.pow(1 + finalWacc, -year);
    const presentValue = ufcf * discountFactor;
    sumPvFcff += presentValue;

    projections.push({
      year,
      phase,
      revenue,
      growthRate,
      grossMargin,
      grossProfit,
      opEx,
      ebit,
      ebitMargin,
      operatingTaxes,
      nopat,
      depreciationAmortization: da,
      capitalExpenditure: capex,
      operatingNetWorkingCapital: nowc,
      changeInNOWC,
      fcff: ufcf,
      ufcf,
      discountFactor,
      presentValue
    });

    prevRevenue = revenue;
    prevNowc = nowc;
  }

  const terminalYear = projections[projections.length - 1]!;
  const terminalEbitda = terminalYear.ebit + (terminalYear.depreciationAmortization ?? 0);

  const effectiveTerminalWacc = Math.max(finalWacc, effectiveTerminalG + 0.005);
  const terminalUfcfNext = terminalYear.fcff * (1 + effectiveTerminalG);
  const gordonTv = terminalUfcfNext / (effectiveTerminalWacc - effectiveTerminalG);

  const exitMultipleTv = Math.max(0, terminalEbitda * exitMultiple);

  let terminalValue = 0;
  if (terminalMethod === 'exit_multiple') {
    terminalValue = exitMultipleTv;
  } else if (terminalMethod === 'blended') {
    terminalValue = (1 - terminalMultipleWeight) * gordonTv + terminalMultipleWeight * exitMultipleTv;
  } else {
    terminalValue = gordonTv;
  }

  const pvTerminalValue = terminalValue * Math.pow(1 + finalWacc, -horizon);
  const enterpriseValue = sumPvFcff + pvTerminalValue;
  const netDebt = totalDebt - cashAndEquivalents;
  const equityValue = enterpriseValue - netDebt - preferredStock - minorityInterest;

  const intrinsicValuePerShare =
    sharesOutstanding > 0 ? Math.max(0, equityValue / sharesOutstanding) : 0;

  const potentialUpside =
    currentPrice > 0 ? (intrinsicValuePerShare - currentPrice) / currentPrice : 0;

  const marginOfSafety =
    intrinsicValuePerShare > 0 ? 1 - currentPrice / intrinsicValuePerShare : 0;

  const terminalValueContribution =
    enterpriseValue > 0 ? pvTerminalValue / enterpriseValue : 0;

  return {
    projections,
    sumPvFcff,
    terminalValue,
    pvTerminalValue,
    enterpriseValue,
    netDebt,
    equityValue,
    intrinsicValuePerShare,
    potentialUpside,
    marginOfSafety,
    terminalValueContribution,
    finalWacc,
    effectiveTerminalG,
    costOfEquity: waccResolution.costOfEquity,
    afterTaxCostOfDebt: waccResolution.afterTaxCostOfDebt,
    equityWeight: waccResolution.equityWeight,
    debtWeight: waccResolution.debtWeight,
    unleveredBeta: waccResolution.unleveredBeta,
    leveredBeta: waccResolution.leveredBeta,
    syntheticRating: waccResolution.synthetic.rating,
    syntheticSpread: waccResolution.synthetic.spread,
    gordonTv,
    exitMultipleTv,
    horizon
  };
}

export function calculate10YearDCF(options: ValuationEngineOptions): DCFOutput {
  const { inputs, currentPrice = 0 } = options;
  const core = calculateCoreDCF(inputs, currentPrice);

  // Sensitivity Analysis Grid (WACC vs Terminal Growth)
  const waccOffsets = [-0.01, -0.005, 0, 0.005, 0.01];
  const gOffsets = [-0.01, -0.005, 0, 0.005, 0.01];

  const sensitivityGrid: SensitivityCell[][] = waccOffsets.map((wOffset) => {
    const testWacc = Math.max(0.04, core.finalWacc + wOffset);
    return gOffsets.map((gOffset) => {
      const testG = core.effectiveTerminalG + gOffset;
      const isValid = testWacc > testG;
      if (!isValid) {
        return {
          wacc: testWacc,
          terminalGrowth: testG,
          intrinsicValue: 0,
          marginOfSafety: 0,
          isValid: false
        };
      }
      const res = calculateCoreDCF(inputs, currentPrice, testWacc, testG, core.horizon);
      return {
        wacc: testWacc,
        terminalGrowth: testG,
        intrinsicValue: res.intrinsicValuePerShare,
        marginOfSafety: res.marginOfSafety,
        isValid: true
      };
    });
  });

  // Multi-Model Valuation Triangulation Matrix
  const triangulation = calculateValuationTriangulation({
    dcfValue: core.intrinsicValuePerShare,
    currentPrice,
    inputs,
    costOfEquity: core.costOfEquity,
    firstYearEbitda: core.projections[0]!.ebit + (core.projections[0]!.depreciationAmortization ?? 0)
  });

  // Monte Carlo Probabilistic Simulation Engine (2,000 Iterations)
  const monteCarlo = runMonteCarloSimulation(inputs, currentPrice, 2000, core.horizon);

  return {
    projections: core.projections,
    sumPvFcff: core.sumPvFcff,
    terminalValue: core.terminalValue,
    pvTerminalValue: core.pvTerminalValue,
    enterpriseValue: core.enterpriseValue,
    netDebt: core.netDebt,
    equityValue: core.equityValue,
    intrinsicValuePerShare: core.intrinsicValuePerShare,
    currentPrice,
    potentialUpside: core.potentialUpside,
    marginOfSafety: core.marginOfSafety,
    terminalValueContribution: core.terminalValueContribution,
    wacc: core.finalWacc,
    terminalGrowthRate: core.effectiveTerminalG,
    costOfEquity: core.costOfEquity,
    afterTaxCostOfDebt: core.afterTaxCostOfDebt,
    equityWeight: core.equityWeight,
    debtWeight: core.debtWeight,
    unleveredBeta: core.unleveredBeta,
    leveredBeta: core.leveredBeta,
    syntheticRating: core.syntheticRating,
    syntheticSpread: core.syntheticSpread,
    gordonTerminalValue: core.gordonTv,
    exitMultipleTerminalValue: core.exitMultipleTv,
    pvExplicitCashFlows: core.sumPvFcff,
    sensitivityGrid,
    triangulation,
    monteCarlo
  };
}

/**
 * Universal wrapper for calculateDCF: runs the institutional Generalized DCF Engine.
 */
export function calculateDCF(options: ValuationEngineOptions): DCFOutput {
  return calculate10YearDCF(options);
}

// ============================================================================
// SCENARIO SIMULATION HELPER
// ============================================================================
function calculateDCFScenario(
  inputs: DCFInputs,
  currentPrice: number,
  wacc: number,
  g: number,
  horizon: number = 10
): { intrinsicValuePerShare: number; marginOfSafety: number } {
  const res = calculateCoreDCF(inputs, currentPrice, wacc, g, horizon);
  return {
    intrinsicValuePerShare: res.intrinsicValuePerShare,
    marginOfSafety: res.marginOfSafety
  };
}

// ============================================================================
// VALUATION TRIANGULATION MATRIX
// ============================================================================
export interface TriangulationOptions {
  dcfValue: number;
  currentPrice: number;
  inputs: DCFInputs;
  costOfEquity: number;
  firstYearEbitda: number;
}

export function calculateValuationTriangulation(opts: TriangulationOptions): ValuationTriangulation {
  const { dcfValue, currentPrice, inputs, costOfEquity, firstYearEbitda } = opts;
  const shares = Math.max(1, inputs.sharesOutstanding);
  const netDebt = (inputs.totalDebt ?? 0) - (inputs.cashAndEquivalents ?? 0);

  // Model 2: SOTP / Peer Multiples (Year 1 EBITDA * Exit Multiple - Net Debt) / Shares
  const evMultiple = Math.max(0, firstYearEbitda * (inputs.exitMultiple ?? 12.0));
  const equityMultiple = Math.max(0, evMultiple - netDebt);
  const multiplesValue = equityMultiple / shares;

  // Model 3: Residual Income Model (RIM)
  // Book Value + PV of Excess ROE returns above Cost of Equity
  const bookValue = Math.max(1, (inputs.cashAndEquivalents ?? 0) + inputs.currentRevenue * 0.40);
  const roe = Math.min(0.40, Math.max(0.08, inputs.operatingMargin * 1.10));
  const excessReturnRate = roe - costOfEquity;
  const pvExcessReturns = (excessReturnRate * bookValue) / Math.max(0.02, costOfEquity - 0.03);
  const rimEquityValue = Math.max(0, bookValue + pvExcessReturns);
  const rimValue = rimEquityValue / shares;

  // Model 4: Reverse DCF Implied Expectation Target
  const reverseDcfTargetPrice = currentPrice;
  const impliedGrowth = reverseDCF(inputs, currentPrice);

  // Weights: DCF 50%, Multiples 25%, RIM 15%, Reverse DCF 10%
  const weights = { dcf: 0.50, multiples: 0.25, rim: 0.15, reverseDcf: 0.10 };

  const blendedIntrinsicValue =
    weights.dcf * dcfValue +
    weights.multiples * multiplesValue +
    weights.rim * rimValue +
    weights.reverseDcf * reverseDcfTargetPrice;

  return {
    dcfValue,
    sotpMultiplesValue: multiplesValue,
    residualIncomeValue: rimValue,
    reverseDcfImpliedGrowth: impliedGrowth,
    reverseDcfTargetPrice,
    blendedIntrinsicValue,
    weights
  };
}

// ============================================================================
// PROBABILISTIC MONTE CARLO SIMULATION ENGINE
// ============================================================================
/**
 * Deterministic seeded pseudo-random generator (Mulberry32) for reproducible,
 * fast, sub-millisecond Monte Carlo simulations.
 */
function mulberry32(a: number): () => number {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Standard Normal variate using Box-Muller transform.
 */
function standardNormal(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function runMonteCarloSimulation(
  inputs: DCFInputs,
  currentPrice: number,
  iterations: number = 2000,
  horizon: number = 10
): MonteCarloResult {
  const rng = mulberry32(1337);
  const baseGrowth = inputs.nearTermGrowthRate ?? inputs.revenueGrowthRates[0] ?? 0.10;
  const baseMargin = inputs.operatingMargin;
  const baseWacc = inputs.wacc ?? 0.10;
  const baseG = inputs.terminalGrowthRate ?? 0.035;

  const results: number[] = new Array(iterations);

  for (let i = 0; i < iterations; i++) {
    // Stochastic perturbations
    const simG = Math.max(-0.05, Math.min(0.40, baseGrowth + standardNormal(rng) * 0.025));
    const simMargin = Math.max(0.04, Math.min(0.65, baseMargin + standardNormal(rng) * 0.020));
    const simWacc = Math.max(baseG + 0.008, Math.min(0.20, baseWacc + standardNormal(rng) * 0.008));

    const simInputs: DCFInputs = {
      ...inputs,
      nearTermGrowthRate: simG,
      operatingMargin: simMargin,
      wacc: simWacc
    };

    const res = calculateDCFScenario(simInputs, currentPrice, simWacc, baseG, horizon);
    results[i] = res.intrinsicValuePerShare;
  }

  // Sort results for percentiles
  results.sort((a, b) => a - b);

  const mean = results.reduce((acc, v) => acc + v, 0) / iterations;
  const median = results[Math.floor(iterations * 0.50)]!;
  const variance = results.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / iterations;
  const stdDev = Math.sqrt(variance);

  const p10 = results[Math.floor(iterations * 0.10)]!;
  const p25 = results[Math.floor(iterations * 0.25)]!;
  const p50 = median;
  const p75 = results[Math.floor(iterations * 0.75)]!;
  const p90 = results[Math.floor(iterations * 0.90)]!;

  // Margin of Safety threshold: Intrinsic >= Price * 1.20 (20%+ discount)
  const safeCount = results.filter((v) => v >= currentPrice * 1.20).length;
  const probabilityOfSafety = safeCount / iterations;

  // Generate 10-bin histogram for distribution fan chart
  const minVal = p10 * 0.85;
  const maxVal = p90 * 1.15;
  const binWidth = Math.max(1, (maxVal - minVal) / 10);
  const histogram: MonteCarloHistogramBin[] = [];

  for (let b = 0; b < 10; b++) {
    const bStart = minVal + b * binWidth;
    const bEnd = bStart + binWidth;
    const inBin = results.filter((v) => v >= bStart && (b === 9 ? v <= bEnd : v < bEnd)).length;
    histogram.push({
      binStart: bStart,
      binEnd: bEnd,
      count: inBin,
      percentage: inBin / iterations
    });
  }

  // Institutional Decision Rule Verdict
  let verdict:
    | 'Strong Buy — Institutional Margin of Safety'
    | 'Buy — Undervalued'
    | 'Fairly Valued'
    | 'Moderately Overvalued'
    | 'Overvalued / Sell Signal' = 'Fairly Valued';

  if (currentPrice <= p25 && probabilityOfSafety >= 0.65) {
    verdict = 'Strong Buy — Institutional Margin of Safety';
  } else if (currentPrice <= p50) {
    verdict = 'Buy — Undervalued';
  } else if (currentPrice <= p75) {
    verdict = 'Fairly Valued';
  } else if (currentPrice <= p90) {
    verdict = 'Moderately Overvalued';
  } else {
    verdict = 'Overvalued / Sell Signal';
  }

  return {
    iterations,
    mean,
    median,
    stdDev,
    p10,
    p25,
    p50,
    p75,
    p90,
    probabilityOfSafety,
    histogram,
    verdict
  };
}

// ============================================================================
// REVERSE DCF (SOLVING FOR MARKET-IMPLIED EXPECTATION)
// ============================================================================
export function reverseDCF(
  inputs: Omit<DCFInputs, 'revenueGrowthRates'> & { revenueGrowthRates?: number[] },
  currentPrice: number
): number {
  if (currentPrice <= 0 || inputs.sharesOutstanding <= 0) return 0;

  const isFiveYearLegacy = inputs.projectionHorizonYears === 5 ||
    (!inputs.projectionHorizonYears && inputs.revenueGrowthRates?.length === 5 && !inputs.nearTermGrowthRate);
  const horizon = isFiveYearLegacy ? 5 : (inputs.projectionHorizonYears ?? 10);

  let low = -0.30;
  let high = 1.0;
  let bestGrowth = 0.08;

  for (let iter = 0; iter < 40; iter++) {
    const mid = (low + high) / 2;
    const testInputs: DCFInputs = {
      ...(inputs as DCFInputs),
      revenueGrowthRates: Array(horizon).fill(mid),
      nearTermGrowthRate: mid,
      projectionHorizonYears: horizon
    };
    const { intrinsicValuePerShare } = calculateCoreDCF(testInputs, currentPrice);

    if (Math.abs(intrinsicValuePerShare - currentPrice) < 0.01) {
      return mid;
    }
    if (intrinsicValuePerShare < currentPrice) {
      low = mid;
    } else {
      high = mid;
    }
    bestGrowth = mid;
  }

  return bestGrowth;
}

// ============================================================================
// SCENARIOS RUNNER (BASE, BULL, BEAR)
// ============================================================================
export function calculateScenarios(
  baseInputs: DCFInputs,
  currentPrice: number
): {
  base: DCFOutput;
  bull: DCFOutput;
  bear: DCFOutput;
} {
  const base = calculateDCF({ inputs: baseInputs, currentPrice });
  const baseWacc = baseInputs.wacc ?? 0.10;
  const baseNearTerm = baseInputs.nearTermGrowthRate ?? baseInputs.revenueGrowthRates[0] ?? 0.10;

  // Bull: +3% growth, +2% margin, -0.5% WACC
  const bullInputs: DCFInputs = {
    ...baseInputs,
    nearTermGrowthRate: baseNearTerm + 0.03,
    revenueGrowthRates: baseInputs.revenueGrowthRates.map((g) => g + 0.025),
    operatingMargin: baseInputs.operatingMargin + 0.02,
    capexRatio: Math.max(0.02, (baseInputs.capexRatio ?? 0.05) - 0.005),
    wacc: Math.max(0.06, baseWacc - 0.005)
  };
  const bull = calculateDCF({ inputs: bullInputs, currentPrice });

  // Bear: -3% growth, -3% margin, +1% WACC
  const bearInputs: DCFInputs = {
    ...baseInputs,
    nearTermGrowthRate: Math.max(-0.1, baseNearTerm - 0.03),
    revenueGrowthRates: baseInputs.revenueGrowthRates.map((g) => Math.max(-0.1, g - 0.03)),
    operatingMargin: Math.max(0.04, baseInputs.operatingMargin - 0.03),
    capexRatio: (baseInputs.capexRatio ?? 0.05) + 0.01,
    wacc: baseWacc + 0.01
  };
  const bear = calculateDCF({ inputs: bearInputs, currentPrice });

  return { base, bull, bear };
}

export * from './analysis.labels.js';
export * from './financialAnalysis.js';
export * from './dcf.js';
export * from './alt-models.js';
export * from './prediction.js';
export * from './calendarReconciliation.js';
export * from './capitalStructure.js';
