import { z } from 'zod';

export const sotpSegmentSchema = z.object({
  name: z.string(),
  revenue: z.number(),
  ebitda: z.number(),
  multiple: z.number(),
  ev: z.number(),
});

export const sotpInputSchema = z.object({
  segments: z.array(z.object({
    name: z.string(),
    revenue: z.number(),
    ebitda: z.number(),
    multiple: z.number(),
  })),
  netDebt: z.number().default(0),
  investments: z.number().default(0),
  sharesOutstanding: z.number().positive(),
});

export const sotpResponseSchema = z.object({
  segments: z.array(sotpSegmentSchema),
  totalEV: z.number(),
  netDebt: z.number(),
  investments: z.number(),
  equityValue: z.number(),
  fairValuePerShare: z.number(),
  currentPrice: z.number(),
  upside: z.number(),
});

export type SotpInput = z.infer<typeof sotpInputSchema>;
export type SotpResponse = z.infer<typeof sotpResponseSchema>;