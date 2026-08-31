import { z } from 'zod';

export const companyParamsSchema = z.object({
  ticker: z.string().min(1).max(10).toUpperCase(),
});

export const identitySchema = z.object({
  ticker: z.string(),
  name: z.string(),
  exchange: z.string(),
  country: z.string(),
  currency: z.string(),
  sector: z.string().nullable(),
  industry: z.string().nullable(),
  description: z.string().nullable(),
  cik: z.string().nullable(),
  lei: z.string().nullable(),
  website: z.string().nullable(),
  logoUrl: z.string().nullable(),
});

export const marketSchema = z.object({
  price: z.number(),
  change: z.number(),
  changePercent: z.number(),
  marketCap: z.number().nullable(),
  sharesOutstanding: z.number().nullable(),
  peRatio: z.number().nullable(),
  pbRatio: z.number().nullable(),
  beta: z.number().nullable(),
  fiftyTwoWeekHigh: z.number().nullable(),
  fiftyTwoWeekLow: z.number().nullable(),
  avgVolume: z.number().nullable(),
  dividendYield: z.number().nullable(),
  updatedAt: z.string(),
});

export const fundamentalsSchema = z.object({
  revenue: z.number().nullable(),
  grossProfit: z.number().nullable(),
  operatingIncome: z.number().nullable(),
  netIncome: z.number().nullable(),
  dilutedEPS: z.number().nullable(),
  revenueGrowth: z.number().nullable(),
  grossMargin: z.number().nullable(),
  ebitMargin: z.number().nullable(),
  netMargin: z.number().nullable(),
  roe: z.number().nullable(),
  roic: z.number().nullable(),
  fcfMargin: z.number().nullable(),
  debtToEbitda: z.number().nullable(),
  currentRatio: z.number().nullable(),
});

export const capitalStructureSchema = z.object({
  cash: z.number().nullable(),
  marketableSecurities: z.number().nullable(),
  shortTermDebt: z.number().nullable(),
  longTermDebt: z.number().nullable(),
  totalDebt: z.number().nullable(),
  netDebt: z.number().nullable(),
  shareholdersEquity: z.number().nullable(),
  sharesOutstanding: z.number().nullable(),
});

export const financialQualitySchema = z.object({
  piotroskiScore: z.number().nullable(),
  altmanZScore: z.number().nullable(),
  benevolishMScore: z.number().nullable(),
  earningsQuality: z.string().nullable(),
});

export const companyResponseSchema = z.object({
  identity: identitySchema,
  market: marketSchema,
  fundamentals: fundamentalsSchema,
  capitalStructure: capitalStructureSchema,
  financialQuality: financialQualitySchema,
});

export type CompanyParams = z.infer<typeof companyParamsSchema>;
export type CompanyResponse = z.infer<typeof companyResponseSchema>;