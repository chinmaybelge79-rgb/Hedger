import { z } from 'zod';

export const residualIncomeInputSchema = z.object({
  bookValuePerShare: z.number().positive(),
  costOfEquity: z.number().min(0).max(0.5),
  forecastYears: z.number().int().min(1).max(20).default(5),
  roe: z.array(z.number()).min(1).max(20),
  payoutRatio: z.number().min(0).max(1).default(0.3),
  terminalGrowth: z.number().min(0).max(0.1).default(0.025),
  sharesOutstanding: z.number().positive(),
});

export const residualIncomeResponseSchema = z.object({
  model: z.literal('Residual Income'),
  bookValuePerShare: z.number(),
  presentValueRi: z.number(),
  fairValuePerShare: z.number(),
  currentPrice: z.number(),
  upside: z.number(),
  forecast: z.array(z.object({
    year: z.number(),
    beginningBV: z.number(),
    netIncome: z.number(),
    residualIncome: z.number(),
    pvRi: z.number(),
    endingBV: z.number(),
  })),
});

export type ResidualIncomeInput = z.infer<typeof residualIncomeInputSchema>;
export type ResidualIncomeResponse = z.infer<typeof residualIncomeResponseSchema>;