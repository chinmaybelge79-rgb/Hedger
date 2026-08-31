import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  type: z.enum(['EQUITY', 'ETF', 'FUND']).optional(),
});

export const searchResultSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  exchange: z.string(),
  type: z.string(),
  currency: z.string(),
});

export const searchResponseSchema = z.object({
  results: z.array(searchResultSchema),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type SearchResult = z.infer<typeof searchResultSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;