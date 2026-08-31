import { z } from 'zod';

export const riskResponseSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  businessRisk: z.number().int().min(0).max(100),
  financialRisk: z.number().int().min(0).max(100),
  valuationRisk: z.number().int().min(0).max(100),
  growthRisk: z.number().int().min(0).max(100),
  marginRisk: z.number().int().min(0).max(100),
  leverageRisk: z.number().int().min(0).max(100),
  cashFlowRisk: z.number().int().min(0).max(100),
  marketRisk: z.number().int().min(0).max(100),
  factors: z.array(z.object({
    factor: z.string(),
    impact: z.enum(['low', 'medium', 'high']),
    reason: z.string(),
  })),
});

export type RiskResponse = z.infer<typeof riskResponseSchema>;