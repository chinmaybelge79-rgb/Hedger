import { z } from 'zod';

export const marketParamsSchema = z.object({
  ticker: z.string().min(1).max(10).toUpperCase(),
});

export const marketSnapshotSchema = z.object({
  ticker: z.string(),
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
  volume: z.number().nullable(),
  updatedAt: z.string(),
});

export const pricePointSchema = z.object({
  date: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
  adjustedClose: z.number(),
});

export const marketResponseSchema = z.object({
  snapshot: marketSnapshotSchema,
  priceHistory: z.array(pricePointSchema),
});

export type MarketParams = z.infer<typeof marketParamsSchema>;
export type MarketResponse = z.infer<typeof marketResponseSchema>;