import { ANALYSIS_LABELS, getLabelForScore } from './analysis.labels.js';

export type MetricDirection = 'higher' | 'lower';

export interface MetricThreshold {
  key: string;
  name: string;
  unit: '%' | 'x' | 'ratio';
  weak: number;
  strong: number;
  direction: MetricDirection;
  weightInPillar?: number | undefined;
}

export interface MetricEvaluation {
  key: string;
  name: string;
  value: number | null;
  unit: '%' | 'x' | 'ratio';
  weakThreshold: number;
  strongThreshold: number;
  direction: MetricDirection;
  score: number | null;
  period?: string | undefined;
  isAvailable: boolean;
}

export interface AnalysisPillar {
  name: string;
  weight: number;
  score: number | null;
  metrics: MetricEvaluation[];
  isAvailable: boolean;
}

export interface FinancialAnalysisInput {
  symbol: string;
  name?: string | undefined;
  companyType?: ('standard' | 'bank' | 'insurance' | 'nbfc') | undefined;
  fiscalPeriod?: string | undefined;
  // Metrics for Standard Companies
  roe?: number | null | undefined;
  operatingMargin?: number | null | undefined;
  revenueCAGR3Y?: number | null | undefined;
  epsCAGR3Y?: number | null | undefined;
  cfoToNetProfit?: number | null | undefined;
  fcfMargin?: number | null | undefined;
  debtToEquity?: number | null | undefined;
  interestCoverage?: number | null | undefined;
  netDebtToEbitda?: number | null | undefined;
  peRatio?: number | null | undefined;
  // Additional metrics for Banks / NBFCs
  roa?: number | null | undefined;
  pbRatio?: number | null | undefined;
  capitalAdequacyRatio?: number | null | undefined;
  grossNpaRatio?: number | null | undefined;
}

export interface FinancialAnalysisOutput {
  symbol: string;
  companyType: 'standard' | 'bank';
  score: number | null;
  label: string;
  meaning: string;
  completeness: number; // percentage (0-100)
  pillars: AnalysisPillar[];
  narrative: string[];
  disclaimer: string;
  asOf: string;
}

export const FORBIDDEN_WORDS = [
  'buy',
  'sell',
  'hold',
  'should',
  'recommend',
  'target',
  'undervalued',
  'overvalued',
  'upside',
  'downside',
  'guarantee'
] as const;

/**
 * Validates text narrative for compliance.
 * Rejects any speculative, promotional or advice-oriented terminology.
 */
export function validateNarrativeText(sentences: string[]): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    for (const word of FORBIDDEN_WORDS) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(lower)) {
        violations.push(`Forbidden word "${word}" found in sentence: "${sentence}"`);
      }
    }
  }
  return { valid: violations.length === 0, violations };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Score metric based on directional thresholds.
 * For higher-is-better: score = clamp(100 * (x - weak) / (strong - weak), 0, 100)
 * For lower-is-better:  score = clamp(100 * (weak - x) / (weak - strong), 0, 100)
 */
export function scoreMetric(value: number, weak: number, strong: number, direction: MetricDirection): number {
  if (direction === 'higher') {
    if (strong === weak) return 50;
    return clamp(Math.round((100 * (value - weak)) / (strong - weak)), 0, 100);
  } else {
    if (weak === strong) return 50;
    return clamp(Math.round((100 * (weak - value)) / (weak - strong)), 0, 100);
  }
}

/**
 * Deterministic Financial Health & Quality Analysis Engine
 */
export function computeFinancialAnalysis(input: FinancialAnalysisInput): FinancialAnalysisOutput {
  const isBank = input.companyType === 'bank' || input.companyType === 'nbfc';
  const period = input.fiscalPeriod || 'FY2025';

  const pillars: AnalysisPillar[] = [];

  if (isBank) {
    // ------------------------------------------------------------------------
    // BANKING / NBFC PILLARS
    // ------------------------------------------------------------------------
    // 1. Profitability (25%)
    const profMetrics: MetricEvaluation[] = [
      createMetricEval('roe', 'Return on Equity (ROE)', input.roe, '%', 0.08, 0.18, 'higher', period),
      createMetricEval('roa', 'Return on Assets (ROA)', input.roa, '%', 0.008, 0.018, 'higher', period)
    ];
    pillars.push(createPillar('Profitability', 0.25, profMetrics));

    // 2. Growth (20%)
    const growthMetrics: MetricEvaluation[] = [
      createMetricEval('revenueCAGR3Y', 'Revenue CAGR (3Y)', input.revenueCAGR3Y, '%', 0.00, 0.15, 'higher', '3Y CAGR'),
      createMetricEval('epsCAGR3Y', 'EPS CAGR (3Y)', input.epsCAGR3Y, '%', 0.00, 0.15, 'higher', '3Y CAGR')
    ];
    pillars.push(createPillar('Growth', 0.20, growthMetrics));

    // 3. Capital Quality (20%)
    const capMetrics: MetricEvaluation[] = [
      createMetricEval('capitalAdequacyRatio', 'Capital Adequacy Ratio', input.capitalAdequacyRatio, '%', 0.12, 0.18, 'higher', period)
    ];
    pillars.push(createPillar('Capital adequacy', 0.20, capMetrics));

    // 4. Asset Quality / Balance Sheet (20%)
    const assetMetrics: MetricEvaluation[] = [
      createMetricEval('grossNpaRatio', 'Gross NPA Ratio', input.grossNpaRatio, '%', 0.04, 0.015, 'lower', period)
    ];
    pillars.push(createPillar('Asset quality', 0.20, assetMetrics));

    // 5. Valuation Context (15%)
    const valMetrics: MetricEvaluation[] = [
      createMetricEval('pbRatio', 'Price to Book (P/B)', input.pbRatio, 'x', 2.8, 1.2, 'lower', 'Trailing')
    ];
    pillars.push(createPillar('Valuation context', 0.15, valMetrics));
  } else {
    // ------------------------------------------------------------------------
    // STANDARD INDUSTRIAL / GENERAL COMPANIES
    // ------------------------------------------------------------------------
    // 1. Profitability (25%)
    const profMetrics: MetricEvaluation[] = [
      createMetricEval('roe', 'Return on Equity (ROE)', input.roe, '%', 0.08, 0.20, 'higher', period),
      createMetricEval('operatingMargin', 'Operating Margin', input.operatingMargin, '%', 0.05, 0.20, 'higher', period)
    ];
    pillars.push(createPillar('Profitability', 0.25, profMetrics));

    // 2. Growth (20%)
    const growthMetrics: MetricEvaluation[] = [
      createMetricEval('revenueCAGR3Y', 'Revenue CAGR (3Y)', input.revenueCAGR3Y, '%', 0.00, 0.15, 'higher', '3Y CAGR'),
      createMetricEval('epsCAGR3Y', 'EPS CAGR (3Y)', input.epsCAGR3Y, '%', 0.00, 0.15, 'higher', '3Y CAGR')
    ];
    pillars.push(createPillar('Growth', 0.20, growthMetrics));

    // 3. Cash Quality (20%)
    const cashMetrics: MetricEvaluation[] = [
      createMetricEval('cfoToNetProfit', 'CFO ÷ Net Profit', input.cfoToNetProfit, 'ratio', 0.60, 1.10, 'higher', period),
      createMetricEval('fcfMargin', 'FCF Margin', input.fcfMargin, '%', 0.00, 0.10, 'higher', period)
    ];
    pillars.push(createPillar('Cash quality', 0.20, cashMetrics));

    // 4. Balance Sheet (20%)
    const bsMetrics: MetricEvaluation[] = [
      createMetricEval('debtToEquity', 'Debt / Equity', input.debtToEquity, 'ratio', 1.50, 0.30, 'lower', period),
      createMetricEval('interestCoverage', 'Interest Coverage', input.interestCoverage, 'x', 1.50, 8.00, 'higher', period),
      createMetricEval('netDebtToEbitda', 'Net Debt / EBITDA', input.netDebtToEbitda, 'x', 4.00, 1.00, 'lower', period)
    ];
    pillars.push(createPillar('Balance sheet', 0.20, bsMetrics));

    // 5. Valuation Context (15%)
    const valMetrics: MetricEvaluation[] = [
      createMetricEval('peRatio', 'Price / Earnings (P/E)', input.peRatio, 'x', 35.0, 15.0, 'lower', 'Trailing')
    ];
    pillars.push(createPillar('Valuation context', 0.15, valMetrics));
  }

  // Calculate completeness & aggregate overall score
  let totalMetricsExpected = 0;
  let totalMetricsAvailable = 0;
  let weightedScoreSum = 0;
  let availableWeightSum = 0;

  for (const pillar of pillars) {
    for (const m of pillar.metrics) {
      totalMetricsExpected++;
      if (m.isAvailable) totalMetricsAvailable++;
    }
    if (pillar.score !== null) {
      weightedScoreSum += pillar.score * pillar.weight;
      availableWeightSum += pillar.weight;
    }
  }

  const completeness = totalMetricsExpected > 0 ? Math.round((totalMetricsAvailable / totalMetricsExpected) * 100) : 0;

  let overallScore: number | null = null;
  if (completeness >= 70 && availableWeightSum > 0) {
    overallScore = Math.round(weightedScoreSum / availableWeightSum);
  }

  const labelInfo = getLabelForScore(overallScore, completeness);

  // Generate factual, neutral narrative
  const rawNarrative = generateFactualNarrative(input, isBank, overallScore, labelInfo.label, period);

  // Validate narrative through strict compliance filter
  const complianceCheck = validateNarrativeText(rawNarrative);
  const narrative = complianceCheck.valid
    ? rawNarrative
    : generateSafeFallbackNarrative(input, overallScore, labelInfo.label, period);

  return {
    symbol: input.symbol,
    companyType: isBank ? 'bank' : 'standard',
    score: overallScore,
    label: labelInfo.label,
    meaning: labelInfo.meaning,
    completeness,
    pillars,
    narrative,
    disclaimer:
      'This analysis describes reported financial data against fixed thresholds. It is not a recommendation to buy, sell or hold any security.',
    asOf: new Date().toISOString()
  };
}

function createMetricEval(
  key: string,
  name: string,
  value: number | null | undefined,
  unit: '%' | 'x' | 'ratio',
  weak: number,
  strong: number,
  direction: MetricDirection,
  period?: string
): MetricEvaluation {
  const isAvailable = typeof value === 'number' && !isNaN(value);
  const score = isAvailable ? scoreMetric(value as number, weak, strong, direction) : null;
  return {
    key,
    name,
    value: isAvailable ? (value as number) : null,
    unit,
    weakThreshold: weak,
    strongThreshold: strong,
    direction,
    score,
    period,
    isAvailable
  };
}

function createPillar(name: string, weight: number, metrics: MetricEvaluation[]): AnalysisPillar {
  const available = metrics.filter((m) => m.isAvailable && m.score !== null);
  const isAvailable = available.length > 0;
  const score = isAvailable
    ? Math.round(available.reduce((acc, m) => acc + (m.score as number), 0) / available.length)
    : null;

  return {
    name,
    weight,
    score,
    metrics,
    isAvailable
  };
}

function formatVal(value: number, unit: '%' | 'x' | 'ratio'): string {
  if (unit === '%') {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (unit === 'x') {
    return `${value.toFixed(1)}x`;
  }
  return value.toFixed(2);
}

function generateFactualNarrative(
  input: FinancialAnalysisInput,
  isBank: boolean,
  score: number | null,
  label: string,
  period: string
): string[] {
  const sentences: string[] = [];

  if (score === null) {
    sentences.push(
      `Financial reporting metrics for ${input.symbol} currently meet ${input.fiscalPeriod || 'partial'} coverage, falling below the 70% threshold required for an aggregate financial health classification.`
    );
    return sentences;
  }

  // 1. Overall assessment sentence
  sentences.push(
    `Financial health for ${input.symbol} is classified as ${label} based on audited metrics across five weighted pillars with an aggregate score of ${score}/100.`
  );

  // 2. Profitability sentence
  if (typeof input.roe === 'number') {
    const roePct = (input.roe * 100).toFixed(1);
    const comparison = input.roe >= 0.20 ? 'exceeding the 20.0% strong benchmark' : input.roe >= 0.08 ? 'between the 8.0% weak and 20.0% strong benchmarks' : 'below the 8.0% benchmark';
    sentences.push(`Return on equity was ${roePct}% in ${period}, ${comparison}.`);
  } else if (typeof input.operatingMargin === 'number') {
    const opPct = (input.operatingMargin * 100).toFixed(1);
    sentences.push(`Reported operating margin stood at ${opPct}% for ${period}.`);
  }

  // 3. Cash Quality / Solvency sentence
  if (!isBank && typeof input.cfoToNetProfit === 'number') {
    const cfoRatio = input.cfoToNetProfit.toFixed(2);
    const status = input.cfoToNetProfit >= 1.0 ? 'reflecting solid operational cash conversion' : 'reflecting working capital absorption';
    sentences.push(`Cash flow from operations to net profit measured ${cfoRatio}, ${status}.`);
  } else if (isBank && typeof input.capitalAdequacyRatio === 'number') {
    const carPct = (input.capitalAdequacyRatio * 100).toFixed(1);
    sentences.push(`Regulatory capital adequacy ratio stood at ${carPct}%, meeting solvency requirements.`);
  }

  // 4. Balance Sheet sentence
  if (!isBank && typeof input.debtToEquity === 'number') {
    const de = input.debtToEquity.toFixed(2);
    sentences.push(`Balance sheet leverage stood at ${de} debt-to-equity in ${period}.`);
  } else if (isBank && typeof input.grossNpaRatio === 'number') {
    const npaPct = (input.grossNpaRatio * 100).toFixed(1);
    sentences.push(`Gross non-performing asset ratio was ${npaPct}% in ${period}.`);
  }

  // 5. Valuation context sentence (neutrality rule: context, not advice!)
  if (!isBank && typeof input.peRatio === 'number') {
    const pe = input.peRatio.toFixed(1);
    sentences.push(
      `Valuation context: The trailing price-to-earnings multiple is ${pe}x; this multiple is provided for peer comparison and historical context rather than as a verdict.`
    );
  } else if (isBank && typeof input.pbRatio === 'number') {
    const pb = input.pbRatio.toFixed(2);
    sentences.push(
      `Valuation context: The price-to-book multiple is ${pb}x, presented for relative context against banking peers.`
    );
  }

  return sentences;
}

function generateSafeFallbackNarrative(
  input: FinancialAnalysisInput,
  score: number | null,
  label: string,
  period: string
): string[] {
  return [
    `Financial metrics for ${input.symbol} evaluate to a score of ${score ?? '—'}/100, designated as ${label}.`,
    `Performance indicators reflect reported financials for ${period} scored against standardized sector benchmarks.`,
    `Valuation metrics are displayed strictly for context without promotional bias.`
  ];
}
