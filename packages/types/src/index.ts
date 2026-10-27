import { z } from 'zod';

export const CurrencyCodeSchema = z.enum([
  'INR',
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'HKD',
  'KRW',
  'AUD',
  'CAD',
  'CHF',
  'CNY',
  'SGD'
]);
export type CurrencyCode = z.infer<typeof CurrencyCodeSchema>;

export const MoneySchema = z.object({
  amount: z.union([z.number(), z.string()]).nullable().optional(),
  currency: z.string().default('INR')
});
export type Money = z.infer<typeof MoneySchema>;

export const FreshnessClassSchema = z.enum([
  'LIVE',
  'DELAYED',
  'EOD',
  'ANNUAL',
  'QUARTERLY',
  'CALCULATED',
  'SAMPLE'
]);
export type FreshnessClass = z.infer<typeof FreshnessClassSchema>;

export const FreshnessMetaSchema = z.object({
  freshness: FreshnessClassSchema,
  asOf: z.string(),
  source: z.string(),
  fallbackFrom: z.string().optional(),
  latencyMs: z.number().optional()
});
export type FreshnessMeta = z.infer<typeof FreshnessMetaSchema>;

export const InstrumentSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  exchange: z.string(),
  currency: z.string(),
  country: z.string().default('India'),
  sector: z.string().optional(),
  industry: z.string().optional(),
  companyType: z.enum(['standard', 'bank', 'insurance', 'nbfc']).default('standard'),
  providerSymbols: z.record(z.string()).default({})
});
export type Instrument = z.infer<typeof InstrumentSchema>;

export const QuoteSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  change: z.number(),
  changePercent: z.number(),
  open: z.number().nullable().optional(),
  high: z.number().nullable().optional(),
  low: z.number().nullable().optional(),
  previousClose: z.number().nullable().optional(),
  volume: z.number().nullable().optional(),
  marketCap: z.number().nullable().optional(),
  sharesOutstanding: z.number().nullable().optional(),
  currency: z.string(),
  meta: FreshnessMetaSchema
});
export type Quote = z.infer<typeof QuoteSchema>;

export const HistoricalBarSchema = z.object({
  date: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number()
});
export type HistoricalBar = z.infer<typeof HistoricalBarSchema>;

export const StatementRowSchema = z.object({
  key: z.string(),
  name: z.string(),
  values: z.array(z.number().nullable()),
  isCalculated: z.boolean().optional()
});
export type StatementRow = z.infer<typeof StatementRowSchema>;

export const FinancialStatementSchema = z.object({
  symbol: z.string(),
  type: z.enum(['income', 'balance', 'cashflow']),
  period: z.enum(['annual', 'quarterly']),
  currency: z.string(),
  fiscalDates: z.array(z.string()),
  rows: z.array(StatementRowSchema),
  meta: FreshnessMetaSchema
});
export type FinancialStatement = z.infer<typeof FinancialStatementSchema>;

export const CompanyProfileSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  description: z.string().optional(),
  exchange: z.string(),
  currency: z.string(),
  sector: z.string().optional(),
  industry: z.string().optional(),
  ceo: z.string().optional(),
  employees: z.number().nullable().optional(),
  website: z.string().optional(),
  country: z.string().optional(),
  companyType: z.enum(['standard', 'bank', 'insurance', 'nbfc']).default('standard'),
  sharesOutstanding: z.number().nullable().optional(),
  marketCap: z.number().nullable().optional(),
  peRatio: z.number().nullable().optional(),
  pbRatio: z.number().nullable().optional(),
  dividendYield: z.number().nullable().optional(),
  week52High: z.number().nullable().optional(),
  week52Low: z.number().nullable().optional(),
  meta: FreshnessMetaSchema
});
export type CompanyProfile = z.infer<typeof CompanyProfileSchema>;

export const DCFInputsSchema = z.object({
  currentRevenue: z.number(),
  revenueGrowthRates: z.array(z.number()), // 5-10 year trajectory or Phase 1-3 rates
  nearTermGrowthRate: z.number().optional(), // Phase 1 (Years 1-3)
  operatingMargin: z.number(), // Target operating margin e.g. 0.20
  baseGrossMargin: z.number().default(0.45).optional(), // Base Gross Margin
  targetGrossMargin: z.number().default(0.48).optional(), // Target Terminal Gross Margin
  baseOperatingMargin: z.number().optional(), // Base Operating Margin before convergence
  targetOperatingMargin: z.number().optional(), // Target Terminal Operating Margin
  taxRate: z.number().default(0.25).optional(),
  reinvestmentRate: z.number().default(0.20).optional(),
  daRatio: z.number().default(0.04).optional(), // D&A as % of revenue
  capexRatio: z.number().default(0.05).optional(), // CapEx as % of revenue
  nowcRatio: z.number().default(0.12).optional(), // Net Operating Working Capital as % of revenue
  baseNowc: z.number().optional(), // Actual base-year NOWC
  riskFreeRate: z.number().default(0.042).optional(),
  unleveredBeta: z.number().optional(), // Pure business risk beta
  beta: z.number().default(1.10).optional(), // Levered equity beta
  equityRiskPremium: z.number().default(0.055).optional(),
  costOfDebt: z.number().default(0.065).optional(),
  terminalMethod: z.enum(['perpetual_growth', 'exit_multiple', 'blended']).default('perpetual_growth').optional(),
  exitMultiple: z.number().default(12.0).optional(),
  terminalMultipleWeight: z.number().default(0.50).optional(), // for blended TV
  wacc: z.number().default(0.10).optional(), // e.g. 10.0%
  terminalGrowthRate: z.number().default(0.035).optional(), // e.g. 3.5%
  cashAndEquivalents: z.number().default(0).optional(),
  totalDebt: z.number().default(0).optional(),
  preferredStock: z.number().default(0).optional(),
  minorityInterest: z.number().default(0).optional(),
  sharesOutstanding: z.number(),
  projectionHorizonYears: z.number().default(10).optional()
});
export type DCFInputs = z.infer<typeof DCFInputsSchema>;

export const ProjectedYearSchema = z.object({
  year: z.number(),
  phase: z.enum(['High Growth', 'Transition', 'Mature']).optional(),
  revenue: z.number(),
  growthRate: z.number().optional(),
  grossMargin: z.number().optional(),
  grossProfit: z.number().optional(),
  opEx: z.number().optional(),
  ebit: z.number(),
  ebitMargin: z.number().optional(),
  operatingTaxes: z.number().optional(),
  nopat: z.number(),
  depreciationAmortization: z.number().optional(),
  capitalExpenditure: z.number().optional(),
  operatingNetWorkingCapital: z.number().optional(),
  changeInNOWC: z.number().optional(),
  fcff: z.number(),
  ufcf: z.number().optional(), // Synonymous with FCFF for unlevered cash flow
  discountFactor: z.number(),
  presentValue: z.number()
});
export type ProjectedYear = z.infer<typeof ProjectedYearSchema>;

export const SensitivityCellSchema = z.object({
  wacc: z.number(),
  terminalGrowth: z.number(),
  intrinsicValue: z.number(),
  marginOfSafety: z.number(),
  isValid: z.boolean().default(true)
});
export type SensitivityCell = z.infer<typeof SensitivityCellSchema>;

export const ValuationTriangulationSchema = z.object({
  dcfValue: z.number(),
  sotpMultiplesValue: z.number(),
  residualIncomeValue: z.number(),
  reverseDcfImpliedGrowth: z.number(),
  reverseDcfTargetPrice: z.number(),
  blendedIntrinsicValue: z.number(),
  weights: z.object({
    dcf: z.number(),
    multiples: z.number(),
    rim: z.number(),
    reverseDcf: z.number()
  })
});
export type ValuationTriangulation = z.infer<typeof ValuationTriangulationSchema>;

export const MonteCarloHistogramBinSchema = z.object({
  binStart: z.number(),
  binEnd: z.number(),
  count: z.number(),
  percentage: z.number()
});
export type MonteCarloHistogramBin = z.infer<typeof MonteCarloHistogramBinSchema>;

export const MonteCarloResultSchema = z.object({
  iterations: z.number(),
  mean: z.number(),
  median: z.number(),
  stdDev: z.number(),
  p10: z.number(), // Bear Case Floor
  p25: z.number(), // Institutional Margin of Safety Threshold
  p50: z.number(), // Base Case Value
  p75: z.number(),
  p90: z.number(), // Bull Case Target
  probabilityOfSafety: z.number(), // % iterations intrinsic value >= market price * 1.20
  histogram: z.array(MonteCarloHistogramBinSchema),
  verdict: z.enum([
    'Strong Buy — Institutional Margin of Safety',
    'Buy — Undervalued',
    'Fairly Valued',
    'Moderately Overvalued',
    'Overvalued / Sell Signal'
  ])
});
export type MonteCarloResult = z.infer<typeof MonteCarloResultSchema>;

export const DCFOutputSchema = z.object({
  projections: z.array(ProjectedYearSchema),
  sumPvFcff: z.number(),
  terminalValue: z.number(),
  pvTerminalValue: z.number(),
  enterpriseValue: z.number(),
  netDebt: z.number(),
  equityValue: z.number(),
  intrinsicValuePerShare: z.number(),
  currentPrice: z.number(),
  potentialUpside: z.number(), // (intrinsic / price) - 1
  marginOfSafety: z.number(), // 1 - (price / intrinsic)
  terminalValueContribution: z.number(), // pvTerminalValue / enterpriseValue
  wacc: z.number(),
  terminalGrowthRate: z.number(),
  costOfEquity: z.number().optional(),
  afterTaxCostOfDebt: z.number().optional(),
  equityWeight: z.number().optional(),
  debtWeight: z.number().optional(),
  unleveredBeta: z.number().optional(),
  leveredBeta: z.number().optional(),
  syntheticRating: z.string().optional(),
  syntheticSpread: z.number().optional(),
  gordonTerminalValue: z.number().optional(),
  exitMultipleTerminalValue: z.number().optional(),
  pvExplicitCashFlows: z.number().optional(),
  sensitivityGrid: z.array(z.array(SensitivityCellSchema)),
  triangulation: ValuationTriangulationSchema.optional(),
  monteCarlo: MonteCarloResultSchema.optional()
});
export type DCFOutput = z.infer<typeof DCFOutputSchema>;

// ============================================================================
// CANONICAL SYMBOL & NAVIGATION SPECIFICATION
// ============================================================================
export const SYMBOL_REGEX = /^[\^A-Za-z0-9][A-Za-z0-9.&\-^=]{0,19}$/;

export function isValidSymbol(symbol: unknown): symbol is string {
  if (typeof symbol !== 'string') return false;
  return SYMBOL_REGEX.test(symbol.trim());
}

export function normalizeSymbol(symbol: string): string {
  if (!symbol) return '';
  return symbol.trim().toUpperCase();
}

// ============================================================================
// CANONICAL DCF WORKBENCH INSTITUTIONAL TYPES
// ============================================================================
export interface InputProvenance<T = number> {
  value: T;
  defaultValue: T;
  source: string;
  period: string;
  date: string;
  notes?: string | undefined;
  isUnavailable?: boolean | undefined;
  unavailableReason?: string | undefined;
}

export interface InstitutionalDcfInputsPackage {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  country: string;
  sector?: string | undefined;
  industry?: string | undefined;
  companyType: 'standard' | 'bank' | 'nbfc' | 'insurance';
  recommendedModel: 'fcff' | 'residual_income';
  currentPrice: number;
  priceDate: string;
  isSampleData?: boolean | undefined;

  // General FCFF inputs
  baseRevenue: InputProvenance<number>;
  growth5y: InputProvenance<number>;
  terminalGrowth: InputProvenance<number>;
  baseMargin: InputProvenance<number>;
  targetMargin: InputProvenance<number>;
  taxRate: InputProvenance<number>;
  terminalTaxRate: InputProvenance<number>;
  salesToCapital: InputProvenance<number>;
  roicTerminal: InputProvenance<number>;

  // WACC inputs
  wacc: InputProvenance<number>;
  riskFreeRate: InputProvenance<number>;
  betaRaw: InputProvenance<number>;
  betaBlume: InputProvenance<number>;
  erp: InputProvenance<number>;
  costOfDebt: InputProvenance<number>;
  taxForWacc: InputProvenance<number>;
  equityWeight: InputProvenance<number>;
  debtWeight: InputProvenance<number>;

  // Bridge inputs
  debt: InputProvenance<number>;
  leases: InputProvenance<number>;
  preferred: InputProvenance<number>;
  minorities: InputProvenance<number>;
  cash: InputProvenance<number>;
  nonOperating: InputProvenance<number>;
  dilutedShares: InputProvenance<number>;

  // Bank / Financial inputs
  bv0?: InputProvenance<number> | undefined;
  roe10y?: InputProvenance<number[]> | undefined;
  payoutRatio?: InputProvenance<number> | undefined;
  ke?: InputProvenance<number> | undefined;
  omega?: InputProvenance<number> | undefined;
  dps1?: InputProvenance<number> | undefined;
  ddmGrowth?: InputProvenance<number> | undefined;

  // Engine configuration options
  midYear: boolean;
  terminalMethod: 'value-driver' | 'plain';
  leaseTreatment: 'debt' | 'operating';
}

export function companyPath(symbol: string): string {
  if (!symbol) return '/';
  const clean = normalizeSymbol(symbol);
  return `/company/${encodeURIComponent(clean)}`;
}
