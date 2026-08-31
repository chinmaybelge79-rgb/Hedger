import { z } from 'zod';

export const confidenceResponseSchema = z.object({
  score: z.number().int().min(0).max(100),
  grade: z.enum(['High', 'Medium', 'Low']),
  components: z.object({
    dataQuality: z.number().int().min(0).max(100),
    modelAgreement: z.number().int().min(0).max(100),
    assumptionStability: z.number().int().min(0).max(100),
    financialQuality: z.number().int().min(0).max(100),
  }),
});

export type ConfidenceResponse = z.infer<typeof confidenceResponseSchema>;