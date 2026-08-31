import Redis from 'ioredis';
import { getEnv } from './env';

const globalForRedis = globalThis as unknown as { redis: Redis };

export const redis = globalForRedis.redis || new Redis(getEnv().REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err));

export async function connectRedis(): Promise<void> {
  if (redis.status === 'wait') {
    await redis.connect();
  }
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}

export function getRedis(): Redis {
  return redis;
}