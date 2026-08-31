import { z } from 'zod';

export const valuationParamsSchema = z.object({
  ticker: z.string().min(1).max(10).toUpperCase(),
});

export const waccResponseSchema = z.object({
  riskFreeRate: z.number(),
  beta: z.number(),
  equityRiskPremium: z.number(),
  costOfEquity: z.number(),
  preTaxCostOfDebt: z.number(),
  taxRate: z.number(),
  afterTaxCostOfDebt: z.number(),
  equityWeight: z.number(),
  debtWeight: z.number(),
  wacc: z.number(),
});

export const dcfInputSchema = z.object({
  forecastYears: z.number().int().min(1).max(20).default(5),
  revenueGrowth: z.array(z.number()).min(1).max(20),
  ebitMargin: z.array(z.number()).min(1).max(20),
  taxRate: z.number().min(0).max(1).default(0.21),
  wacc: z.number().min(0).max(1).default(0.08),
  terminalGrowth: z.number().min(0).max(0.1).default(0.025),
  sharesOutstanding: z.number().positive().optional(),
  netDebt: z.number().optional(),
  cash: z.number().optional(),
});

export const dcfForecastSchema = z.object({
  year: z.number(),
  revenue: z.number(),
  ebitda: z.number(),
  ebit: z.number(),
  tax: z.number(),
  nopat: z.number(),
  depreciationAmortization: z.number(),
  capex: z.number(),
  changeInNwc: z.number(),
  fcff: z.number(),
  pvFcff: z.number(),
});

export const dcfResponseSchema = z.object({
  model: z.literal('DCF'),
  enterpriseValue: z.number(),
  equityValue: z.number(),
  fairValuePerShare: z.number(),
  currentPrice: z.number(),
  upside: z.number(),
  wacc: z.number(),
  terminalGrowth: z.number(),
  forecast: z.array(dcfForecastSchema),
  terminalValue: z.number(),
  pvTerminalValue: z.number(),
  pvFcff: z.number(),
  netDebt: z.number(),
  sharesOutstanding: z.number(),
});

export const reverseDcfInputSchema = z.object({
  currentPrice: z.number().positive(),
  wacc: z.number().min(0).max(1),
  terminalGrowth: z.number().min(0).max(0.1),
  sharesOutstanding: z.number().positive().optional(),
  netDebt: z.number().optional(),
  cash: z.number().optional(),
});

export const reverseDcfResponseSchema = z.object({
  impliedRevenueGrowth: z.number(),
  impliedTerminalMargin: z.number(),
  impliedFcfGrowth: z.number(),
  interpretation: z.string(),
});

export type ValuationParams = z.infer<typeof valuationParamsSchema>;
export type WaccResponse = z.infer<typeof waccResponseSchema>;
export type DcfInput = z.infer<typeof dcfInputSchema>;
export type DcfResponse = z.infer<typeof dcfResponseSchema>;
export type ReverseDcfInput = z.infer<typeof reverseDcfInputSchema>;
export type ReverseDcfResponse = z.infer<typeof reverseDcfResponseSchema>;