import { z } from 'zod';

export const sensitivityInputSchema = z.object({
  baseWacc: z.number().min(0).max(0.3),
  baseTerminalGrowth: z.number().min(0).max(0.1),
  waccRange: z.number().min(0.005).max(0.05).default(0.02),
  terminalRange: z.number().min(0.005).max(0.05).default(0.015),
  steps: z.number().int().min(3).max(15).default(5),
});

export const sensitivityResponseSchema = z.object({
  rows: z.array(z.number()),
  columns: z.array(z.number()),
  values: z.array(z.array(z.number())),
});

export const scenarioInputSchema = z.object({
  bear: z.object({
    revenueGrowth: z.array(z.number()),
    ebitMargin: z.array(z.number()),
    taxRate: z.number(),
    wacc: z.number(),
    terminalGrowth: z.number(),
  }),
  base: z.object({
    revenueGrowth: z.array(z.number()),
    ebitMargin: z.array(z.number()),
    taxRate: z.number(),
    wacc: z.number(),
    terminalGrowth: z.number(),
  }),
  bull: z.object({
    revenueGrowth: z.array(z.number()),
    ebitMargin: z.array(z.number()),
    taxRate: z.number(),
    wacc: z.number(),
    terminalGrowth: z.number(),
  }),
  weights: z.object({
    bear: z.number().min(0).max(1).default(0.25),
    base: z.number().min(0).max(1).default(0.5),
    bull: z.number().min(0).max(1).default(0.25),
  }),
});

export const scenarioResponseSchema = z.object({
  bear: z.object({ fairValue: z.number(), upside: z.number() }),
  base: z.object({ fairValue: z.number(), upside: z.number() }),
  bull: z.object({ fairValue: z.number(), upside: z.number() }),
  weightedValue: z.number(),
});

export const monteCarloInputSchema = z.object({
  iterations: z.number().int().min(100).max(50000).default(2000),
  variables: z.object({
    revenueGrowth: z.object({ mean: z.number(), stdDev: z.number() }),
    ebitMargin: z.object({ mean: z.number(), stdDev: z.number() }),
    wacc: z.object({ mean: z.number(), stdDev: z.number() }),
    terminalGrowth: z.object({ mean: z.number(), stdDev: z.number() }),
  }),
  baseInputs: z.object({
    forecastYears: z.number().int().min(1).max(20).default(5),
    taxRate: z.number().min(0).max(1).default(0.21),
    sharesOutstanding: z.number().positive(),
    netDebt: z.number(),
    cash: z.number(),
  }),
});

export const monteCarloResponseSchema = z.object({
  iterations: z.number(),
  mean: z.number(),
  median: z.number(),
  p10: z.number(),
  p25: z.number(),
  p75: z.number(),
  p90: z.number(),
  distribution: z.array(z.object({ value: z.number(), count: z.number() })),
});

export type SensitivityInput = z.infer<typeof sensitivityInputSchema>;
export type SensitivityResponse = z.infer<typeof sensitivityResponseSchema>;
export type ScenarioInput = z.infer<typeof scenarioInputSchema>;
export type ScenarioResponse = z.infer<typeof scenarioResponseSchema>;
export type MonteCarloInput = z.infer<typeof monteCarloInputSchema>;
export type MonteCarloResponse = z.infer<typeof monteCarloResponseSchema>;