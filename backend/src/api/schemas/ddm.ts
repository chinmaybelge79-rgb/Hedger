import { z } from 'zod';

export const ddmInputSchema = z.object({
  model: z.enum(['gordon', 'two-stage', 'three-stage']),
  currentDividend: z.number().positive(),
  growthRate: z.number().min(-0.5).max(0.5),
  terminalGrowth: z.number().min(0).max(0.1).default(0.025),
  costOfEquity: z.number().min(0).max(0.5),
  highGrowthYears: z.number().int().min(1).max(10).default(5),
  highGrowthRate: z.number().min(-0.5).max(1).optional(),
  stableGrowthRate: z.number().min(-0.1).max(0.1).optional(),
  sharesOutstanding: z.number().positive(),
});

export const ddmResponseSchema = z.object({
  model: z.string(),
  fairValuePerShare: z.number(),
  currentPrice: z.number(),
  upside: z.number(),
  inputs: z.record(z.any()),
});

export type DdmInput = z.infer<typeof ddmInputSchema>;
export type DdmResponse = z.infer<typeof ddmResponseSchema>;