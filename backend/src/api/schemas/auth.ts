import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(80).optional(),
});

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  plan: z.string(),
  createdAt: z.date(),
});

export const watchlistAddSchema = z.object({
  ticker: z.string().min(1).max(10).toUpperCase(),
  note: z.string().max(500).optional(),
  targetPrice: z.number().positive().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type WatchlistAddInput = z.infer<typeof watchlistAddSchema>;
