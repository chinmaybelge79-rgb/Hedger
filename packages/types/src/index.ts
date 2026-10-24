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
  revenueGrowthRates: z.array(z.number()), // 5-year trajectory
  operatingMargin: z.number(), // Target operating margin e.g. 0.20
  taxRate: z.number().default(0.25).optional(),
  reinvestmentRate: z.number().default(0.20).optional(),
  daRatio: z.number().default(0.04).optional(), // D&A as % of revenue
  capexRatio: z.number().default(0.05).optional(), // CapEx as % of revenue
  nowcRatio: z.number().default(0.12).optional(), // Net Operating Working Capital as % of revenue
  baseNowc: z.number().optional(), // Actual base-year NOWC
  riskFreeRate: z.number().default(0.042).optional(),
  beta: z.number().default(1.10).optional(),
  equityRiskPremium: z.number().default(0.055).optional(),
  costOfDebt: z.number().default(0.065).optional(),
  terminalMethod: z.enum(['perpetual_growth', 'exit_multiple']).default('perpetual_growth').optional(),
  exitMultiple: z.number().default(12.0).optional(),
  wacc: z.number().default(0.10).optional(), // e.g. 10.0%
  terminalGrowthRate: z.number().default(0.035).optional(), // e.g. 3.5%
  cashAndEquivalents: z.number().default(0).optional(),
  totalDebt: z.number().default(0).optional(),
  sharesOutstanding: z.number()
});
export type DCFInputs = z.infer<typeof DCFInputsSchema>;

export const ProjectedYearSchema = z.object({
  year: z.number(),
  revenue: z.number(),
  growthRate: z.number().optional(),
  ebit: z.number(),
  ebitMargin: z.number().optional(),
  operatingTaxes: z.number().optional(),
  nopat: z.number(),
  depreciationAmortization: z.number().optional(),
  capitalExpenditure: z.number().optional(),
  operatingNetWorkingCapital: z.number().optional(),
  changeInNOWC: z.number().optional(),
  fcff: z.number(),
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
  sensitivityGrid: z.array(z.array(SensitivityCellSchema))
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

export function companyPath(symbol: string): string {
  if (!symbol) return '/';
  const clean = normalizeSymbol(symbol);
  return `/company/${encodeURIComponent(clean)}`;
}
