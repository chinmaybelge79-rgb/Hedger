import { z } from 'zod';

export const evaInputSchema = z.object({
  wacc: z.number().min(0).max(0.5),
  forecastYears: z.number().int().min(1).max(20).default(5),
  nopat: z.array(z.number()).min(1).max(20),
  investedCapital: z.array(z.number()).min(1).max(20),
  terminalGrowth: z.number().min(0).max(0.1).default(0.025),
  currentInvestedCapital: z.number().positive(),
  sharesOutstanding: z.number().positive(),
});

export const evaResponseSchema = z.object({
  model: z.literal('EVA'),
  currentEVA: z.number(),
  presentValueEVA: z.number(),
  fairValuePerShare: z.number(),
  currentPrice: z.number(),
  upside: z.number(),
  investedCapital: z.number(),
  forecast: z.array(z.object({
    year: z.number(),
    nopat: z.number(),
    investedCapital: z.number(),
    capitalCharge: z.number(),
    eva: z.number(),
    pvEva: z.number(),
  })),
});

export type EvaInput = z.infer<typeof evaInputSchema>;
export type EvaResponse = z.infer<typeof evaResponseSchema>;