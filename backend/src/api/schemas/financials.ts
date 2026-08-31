import { z } from 'zod';

export const financialsParamsSchema = z.object({
  ticker: z.string().min(1).max(10).toUpperCase(),
});

export const financialsQuerySchema = z.object({
  period: z.enum(['annual', 'quarterly']).default('annual'),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export const incomeStatementSchema = z.object({
  period: z.string(),
  periodEnd: z.string(),
  revenue: z.number().nullable(),
  costOfRevenue: z.number().nullable(),
  grossProfit: z.number().nullable(),
  operatingExpense: z.number().nullable(),
  sellingGeneralAdmin: z.number().nullable(),
  researchDevelopment: z.number().nullable(),
  operatingIncome: z.number().nullable(),
  interestExpense: z.number().nullable(),
  interestIncome: z.number().nullable(),
  otherIncomeExpense: z.number().nullable(),
  pretaxIncome: z.number().nullable(),
  taxExpense: z.number().nullable(),
  netIncome: z.number().nullable(),
  dilutedEPS: z.number().nullable(),
  basicEPS: z.number().nullable(),
  sharesDiluted: z.number().nullable(),
  sharesBasic: z.number().nullable(),
});

export const balanceSheetSchema = z.object({
  period: z.string(),
  periodEnd: z.string(),
  cashAndEquivalents: z.number().nullable(),
  marketableSecurities: z.number().nullable(),
  accountsReceivable: z.number().nullable(),
  inventory: z.number().nullable(),
  currentAssets: z.number().nullable(),
  propertyPlantEquipment: z.number().nullable(),
  goodwill: z.number().nullable(),
  intangibleAssets: z.number().nullable(),
  totalAssets: z.number().nullable(),
  accountsPayable: z.number().nullable(),
  currentLiabilities: z.number().nullable(),
  shortTermDebt: z.number().nullable(),
  longTermDebt: z.number().nullable(),
  totalDebt: z.number().nullable(),
  totalLiabilities: z.number().nullable(),
  shareholdersEquity: z.number().nullable(),
  retainedEarnings: z.number().nullable(),
  treasuryStock: z.number().nullable(),
});

export const cashFlowSchema = z.object({
  period: z.string(),
  periodEnd: z.string(),
  netIncome: z.number().nullable(),
  depreciationAmortization: z.number().nullable(),
  stockBasedCompensation: z.number().nullable(),
  changeInWorkingCapital: z.number().nullable(),
  operatingCashFlow: z.number().nullable(),
  capitalExpenditure: z.number().nullable(),
  acquisitions: z.number().nullable(),
  investingCashFlow: z.number().nullable(),
  debtIssued: z.number().nullable(),
  debtRepaid: z.number().nullable(),
  shareRepurchases: z.number().nullable(),
  dividendsPaid: z.number().nullable(),
  financingCashFlow: z.number().nullable(),
  freeCashFlow: z.number().nullable(),
  freeCashFlowPerShare: z.number().nullable(),
});

export const derivedMetricsSchema = z.object({
  period: z.string(),
  revenueGrowth: z.number().nullable(),
  grossMargin: z.number().nullable(),
  ebitMargin: z.number().nullable(),
  ebitdaMargin: z.number().nullable(),
  netMargin: z.number().nullable(),
  roe: z.number().nullable(),
  roic: z.number().nullable(),
  roa: z.number().nullable(),
  fcfMargin: z.number().nullable(),
  fcfConversion: z.number().nullable(),
  debtToEbitda: z.number().nullable(),
  netDebtToEbitda: z.number().nullable(),
  currentRatio: z.number().nullable(),
  quickRatio: z.number().nullable(),
  assetTurnover: z.number().nullable(),
  workingCapital: z.number().nullable(),
  epsGrowth: z.number().nullable(),
  bookValueGrowth: z.number().nullable(),
});

export const financialsResponseSchema = z.object({
  incomeStatement: z.array(incomeStatementSchema),
  balanceSheet: z.array(balanceSheetSchema),
  cashFlow: z.array(cashFlowSchema),
  derivedMetrics: z.array(derivedMetricsSchema),
});

export type FinancialsParams = z.infer<typeof financialsParamsSchema>;
export type FinancialsQuery = z.infer<typeof financialsQuerySchema>;
export type FinancialsResponse = z.infer<typeof financialsResponseSchema>;