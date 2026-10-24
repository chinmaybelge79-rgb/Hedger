import type { DCFInputs, DCFOutput, ProjectedYear, SensitivityCell } from '@hedger/types';

export interface ValuationEngineOptions {
  inputs: DCFInputs;
  currentPrice: number;
}

/**
 * Calculates an institutional-grade FCFF Discounted Cash Flow valuation.
 * 
 * Pipeline:
 * 1. Linked 5-year financial forecasting (Revenue, EBIT, NOPAT, D&A, CapEx, NOWC, FCFF)
 * 2. WACC estimation (CAPM cost of equity + after-tax cost of debt)
 * 3. Terminal value (Perpetual Growth or Exit Multiple)
 * 4. Enterprise Value & Equity Bridge (Cash - Debt)
 * 5. Intrinsic Value per Share, Potential Upside, and Margin of Safety
 * 6. WACC vs Terminal Growth Sensitivity Analysis
 */
export function calculateDCF(options: ValuationEngineOptions): DCFOutput {
  const { inputs, currentPrice } = options;
  const {
    currentRevenue,
    revenueGrowthRates,
    operatingMargin,
    taxRate = 0.25,
    daRatio = 0.04,
    capexRatio = 0.05,
    nowcRatio = 0.12,
    baseNowc = currentRevenue * 0.12,
    riskFreeRate = 0.042,
    beta = 1.10,
    equityRiskPremium = 0.055,
    costOfDebt = 0.065,
    terminalMethod = 'perpetual_growth',
    exitMultiple = 12.0,
    wacc: userWacc = 0,
    terminalGrowthRate = 0.035,
    cashAndEquivalents = 0,
    totalDebt = 0,
    sharesOutstanding
  } = inputs;

  // 1. Calculate WACC via CAPM if not explicitly overridden
  const costOfEquity = riskFreeRate + beta * equityRiskPremium;
  const afterTaxCostOfDebt = costOfDebt * (1 - taxRate);
  
  const estimatedMarketEquity = currentPrice > 0 && sharesOutstanding > 0 
    ? currentPrice * sharesOutstanding 
    : currentRevenue * 1.5;
  const totalCapital = Math.max(1, estimatedMarketEquity + totalDebt);
  const equityWeight = estimatedMarketEquity / totalCapital;
  const debtWeight = totalDebt / totalCapital;

  const calculatedWacc = equityWeight * costOfEquity + debtWeight * afterTaxCostOfDebt;
  const finalWacc = userWacc > 0 ? userWacc : calculatedWacc;

  // 2. Linked 5-Year Financial Forecast
  const projections: ProjectedYear[] = [];
  let prevRevenue = currentRevenue;
  let prevNowc = baseNowc;
  let sumPvFcff = 0;

  for (let year = 1; year <= 5; year++) {
    const growthRate = revenueGrowthRates[year - 1] ?? 0.08;
    const revenue = prevRevenue * (1 + growthRate);
    const ebit = revenue * operatingMargin;
    const operatingTaxes = ebit * taxRate;
    const nopat = ebit - operatingTaxes; // NOPAT = EBIT * (1 - T)
    const da = revenue * daRatio;
    const capex = revenue * capexRatio;
    
    // Operating Net Working Capital & Delta
    const nowc = revenue * nowcRatio;
    const changeInNOWC = nowc - prevNowc;

    // Standard FCFF Identity: NOPAT + D&A - CapEx - Delta NOWC
    const fcff = nopat + da - capex - changeInNOWC;

    // Discounting
    const discountFactor = Math.pow(1 + finalWacc, -year);
    const presentValue = fcff * discountFactor;

    sumPvFcff += presentValue;

    projections.push({
      year,
      revenue,
      growthRate,
      ebit,
      ebitMargin: operatingMargin,
      operatingTaxes,
      nopat,
      depreciationAmortization: da,
      capitalExpenditure: capex,
      operatingNetWorkingCapital: nowc,
      changeInNOWC,
      fcff,
      discountFactor,
      presentValue
    });

    prevRevenue = revenue;
    prevNowc = nowc;
  }

  // 3. Terminal Value Calculation
  const finalYear = projections[4]!;
  let terminalValue = 0;

  if (terminalMethod === 'exit_multiple') {
    // Exit EV/EBITDA Multiple method
    const finalEbitda = finalYear.ebit + (finalYear.depreciationAmortization ?? 0);
    terminalValue = Math.max(0, finalEbitda * exitMultiple);
  } else {
    // Perpetual Gordon Growth method
    // Require WACC > g for validity
    const effectiveWacc = Math.max(finalWacc, terminalGrowthRate + 0.005);
    const fcffNext = finalYear.fcff * (1 + terminalGrowthRate);
    terminalValue = fcffNext / (effectiveWacc - terminalGrowthRate);
  }

  const pvTerminalValue = terminalValue * Math.pow(1 + finalWacc, -5);

  // 4. Enterprise Value and Equity Value Bridge
  const enterpriseValue = sumPvFcff + pvTerminalValue;
  const netDebt = totalDebt - cashAndEquivalents;
  const equityValue = enterpriseValue - netDebt;

  // 5. Per-Share Valuation & Safety Metrics
  const intrinsicValuePerShare =
    sharesOutstanding > 0 ? Math.max(0, equityValue / sharesOutstanding) : 0;

  // Potential Upside = (Intrinsic / Price) - 1
  const potentialUpside =
    currentPrice > 0 ? (intrinsicValuePerShare - currentPrice) / currentPrice : 0;

  // Margin of Safety = 1 - (Price / Intrinsic)
  const marginOfSafety =
    intrinsicValuePerShare > 0 ? 1 - currentPrice / intrinsicValuePerShare : 0;

  // Diagnostic: Terminal Value contribution
  const terminalValueContribution =
    enterpriseValue > 0 ? pvTerminalValue / enterpriseValue : 0;

  // 6. Sensitivity Matrix: WACC vs Terminal Growth Rate
  const waccOffsets = [-0.01, -0.005, 0, 0.005, 0.01];
  const gOffsets = [-0.01, -0.005, 0, 0.005, 0.01];

  const sensitivityGrid: SensitivityCell[][] = waccOffsets.map((wOffset) => {
    const testWacc = Math.max(0.04, finalWacc + wOffset);
    return gOffsets.map((gOffset) => {
      const testG = terminalGrowthRate + gOffset;
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
      const res = calculateDCFScenario(inputs, currentPrice, testWacc, testG);
      return {
        wacc: testWacc,
        terminalGrowth: testG,
        intrinsicValue: res.intrinsicValuePerShare,
        marginOfSafety: res.marginOfSafety,
        isValid: true
      };
    });
  });

  return {
    projections,
    sumPvFcff,
    terminalValue,
    pvTerminalValue,
    enterpriseValue,
    netDebt,
    equityValue,
    intrinsicValuePerShare,
    currentPrice,
    potentialUpside,
    marginOfSafety,
    terminalValueContribution,
    wacc: finalWacc,
    terminalGrowthRate,
    costOfEquity,
    afterTaxCostOfDebt,
    equityWeight,
    debtWeight,
    sensitivityGrid
  };
}

function calculateDCFScenario(
  inputs: DCFInputs,
  currentPrice: number,
  wacc: number,
  g: number
): { intrinsicValuePerShare: number; marginOfSafety: number } {
  let prevRevenue = inputs.currentRevenue;
  let prevNowc = inputs.baseNowc ?? inputs.currentRevenue * 0.12;
  let sumPv = 0;
  let lastFcff = 0;

  const daRatio = inputs.daRatio ?? 0.04;
  const capexRatio = inputs.capexRatio ?? 0.05;
  const nowcRatio = inputs.nowcRatio ?? 0.12;
  const taxRate = inputs.taxRate ?? 0.25;

  for (let year = 1; year <= 5; year++) {
    const growth = inputs.revenueGrowthRates[year - 1] ?? 0.08;
    const revenue = prevRevenue * (1 + growth);
    const ebit = revenue * inputs.operatingMargin;
    const nopat = ebit * (1 - taxRate);
    const da = revenue * daRatio;
    const capex = revenue * capexRatio;
    const nowc = revenue * nowcRatio;
    const changeInNOWC = nowc - prevNowc;

    const fcff = nopat + da - capex - changeInNOWC;
    sumPv += fcff * Math.pow(1 + wacc, -year);
    lastFcff = fcff;
    prevRevenue = revenue;
    prevNowc = nowc;
  }

  const effectiveWacc = Math.max(wacc, g + 0.005);
  const tv = (lastFcff * (1 + g)) / (effectiveWacc - g);
  const pvTv = tv * Math.pow(1 + wacc, -5);
  const ev = sumPv + pvTv;
  const debt = inputs.totalDebt ?? 0;
  const cash = inputs.cashAndEquivalents ?? 0;
  const equityVal = ev - (debt - cash);
  const perShare = inputs.sharesOutstanding > 0 ? Math.max(0, equityVal / inputs.sharesOutstanding) : 0;
  const mos = perShare > 0 ? 1 - currentPrice / perShare : 0;

  return { intrinsicValuePerShare: perShare, marginOfSafety: mos };
}

/**
 * Reverse DCF: Solves for the implied 5-year revenue growth rate that equates
 * intrinsic value to current market price using binary search.
 */
export function reverseDCF(
  inputs: Omit<DCFInputs, 'revenueGrowthRates'>,
  currentPrice: number
): number {
  if (currentPrice <= 0 || inputs.sharesOutstanding <= 0) return 0;

  let low = -0.30; // -30% CAGR
  let high = 1.0;  // 100% CAGR
  let bestGrowth = 0.08;

  for (let iter = 0; iter < 40; iter++) {
    const mid = (low + high) / 2;
    const testInputs: DCFInputs = {
      ...inputs,
      revenueGrowthRates: [mid, mid, mid, mid, mid]
    };
    const { intrinsicValuePerShare } = calculateDCF({ inputs: testInputs, currentPrice });

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

/**
 * Computes Base, Bull, and Bear scenarios by rerunning the complete DCF valuation.
 */
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

  // Bull: +2.5% revenue growth, +2% margin, -0.5% WACC
  const bullInputs: DCFInputs = {
    ...baseInputs,
    revenueGrowthRates: baseInputs.revenueGrowthRates.map((g) => g + 0.025),
    operatingMargin: baseInputs.operatingMargin + 0.02,
    capexRatio: Math.max(0.02, (baseInputs.capexRatio ?? 0.05) - 0.005),
    wacc: Math.max(0.06, baseWacc - 0.005)
  };
  const bull = calculateDCF({ inputs: bullInputs, currentPrice });

  // Bear: -3% revenue growth, -3% margin, +1% WACC
  const bearInputs: DCFInputs = {
    ...baseInputs,
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
