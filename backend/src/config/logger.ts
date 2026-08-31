import pino from 'pino';
import { getEnv } from './env';

const env = getEnv();

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } : undefined,
  base: {
    service: 'hedger-backend',
    env: env.NODE_ENV,
  },
});

export function createChildLogger(context: Record<string, unknown>): pino.Logger {
  return logger.child(context);
}