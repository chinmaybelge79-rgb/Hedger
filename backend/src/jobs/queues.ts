import { Queue, Worker, Job } from 'bullmq';
import { redis } from '@config/redis';
import { getEnv } from '@config/env';
import { logger } from '@config/logger';

const env = getEnv();

export const marketRefreshQueue = new Queue('market-refresh', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

export const financialRefreshQueue = new Queue('financial-refresh', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 },
  },
});

export const valuationRefreshQueue = new Queue('valuation-refresh', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

export async function initializeJobQueues(): Promise<void> {
  marketRefreshQueue.on('error', (err) => logger.error({ err }, 'Market refresh queue error'));
  financialRefreshQueue.on('error', (err) => logger.error({ err }, 'Financial refresh queue error'));
  valuationRefreshQueue.on('error', (err) => logger.error({ err }, 'Valuation refresh queue error'));

  logger.info('Job queues initialized');
}

export async function shutdownJobQueues(): Promise<void> {
  await Promise.all([
    marketRefreshQueue.close(),
    financialRefreshQueue.close(),
    valuationRefreshQueue.close(),
  ]);
  logger.info('Job queues shut down');
}

export async function scheduleMarketRefresh(ticker: string): Promise<void> {
  await marketRefreshQueue.add('refresh-market', { ticker }, { jobId: `market-${ticker}-${Date.now()}` });
}

export async function scheduleFinancialRefresh(ticker: string): Promise<void> {
  await financialRefreshQueue.add('refresh-financials', { ticker }, { jobId: `financial-${ticker}-${Date.now()}` });
}

export async function scheduleValuationRefresh(ticker: string, model: string): Promise<void> {
  await valuationRefreshQueue.add('refresh-valuation', { ticker, model }, { jobId: `valuation-${ticker}-${model}-${Date.now()}` });
}

export interface MarketRefreshJobData {
  ticker: string;
}

export interface FinancialRefreshJobData {
  ticker: string;
}

export interface ValuationRefreshJobData {
  ticker: string;
  model: string;
}