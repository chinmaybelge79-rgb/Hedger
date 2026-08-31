import { z } from 'zod';

export const compsInputSchema = z.object({
  peers: z.array(z.string()).optional(),
  metrics: z.array(z.enum(['EV_REVENUE', 'EV_EBITDA', 'EV_EBIT', 'PE', 'P_FCF', 'EV_FCF'])).default(['EV_REVENUE', 'EV_EBITDA', 'PE']),
});

export const peerMetricSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  evRevenue: z.number().nullable(),
  evEbitda: z.number().nullable(),
  evEbit: z.number().nullable(),
  pe: z.number().nullable(),
  pFcf: z.number().nullable(),
  evFcf: z.number().nullable(),
});

export const compsResponseSchema = z.object({
  targetTicker: z.string(),
  peerGroup: z.array(peerMetricSchema),
  medianMultiples: z.object({
    evRevenue: z.number().nullable(),
    evEbitda: z.number().nullable(),
    evEbit: z.number().nullable(),
    pe: z.number().nullable(),
    pFcf: z.number().nullable(),
    evFcf: z.number().nullable(),
  }),
  impliedEV: z.number(),
  impliedEquity: z.number(),
  fairValuePerShare: z.number(),
  currentPrice: z.number(),
  upside: z.number(),
});

export type CompsInput = z.infer<typeof compsInputSchema>;
export type CompsResponse = z.infer<typeof compsResponseSchema>;