import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const ConfigSchema = z.object({
  PORT: z.string().default('3001').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FINNHUB_API_KEY: z.string().min(1, 'FINNHUB_API_KEY is required'),
  ALPHAVANTAGE_API_KEY: z.string().min(1, 'ALPHAVANTAGE_API_KEY is required'),
  YF_GATEWAY_URL: z.string().url().default('http://127.0.0.1:8001'),
  YF_GATEWAY_SECRET: z.string().default('hedger_local_secret_token_2026'),
  SESSION_SECRET: z.string().default('hedger_session_dev_secret_key_32chars_min'),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  NVIDIA_NIM_API_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173')
});

export const config = ConfigSchema.parse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  FINNHUB_API_KEY: process.env.FINNHUB_API_KEY,
  ALPHAVANTAGE_API_KEY: process.env.ALPHAVANTAGE_API_KEY,
  YF_GATEWAY_URL: process.env.YF_GATEWAY_URL,
  YF_GATEWAY_SECRET: process.env.YF_GATEWAY_SECRET,
  SESSION_SECRET: process.env.SESSION_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  NVIDIA_NIM_API_KEY: process.env.NVIDIA_NIM_API_KEY || process.env.NVIDIA_API_KEY,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || process.env.VITE_APP_URL || 'http://localhost:5173'
});
