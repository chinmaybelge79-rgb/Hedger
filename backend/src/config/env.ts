import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  DATABASE_URL: z.string().url(),

  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  PROVIDER_API_KEY: z.string().optional(),
  PROVIDER_BASE_URL: z.string().url().optional(),

  FRED_API_KEY: z.string().optional(),

  JWT_SECRET: z.string().min(32).optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),

  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  VALUATION_JOB_CONCURRENCY: z.coerce.number().default(5),
  MARKET_REFRESH_INTERVAL_MS: z.coerce.number().default(30000),
  FINANCIAL_REFRESH_INTERVAL_HOURS: z.coerce.number().default(24),

  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

export function loadEnv(): Env {
  if (env) return env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }

  env = result.data;
  return env;
}

export function getEnv(): Env {
  if (!env) return loadEnv();
  return env;
}