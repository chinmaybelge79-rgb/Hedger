import { prisma } from '@config/database';
import { redis } from '@config/redis';
import { MarketResponse } from '@api/schemas/market';
import { logger } from '@config/logger';

const MARKET_CACHE_TTL = 30;

export async function getMarketData(ticker: string): Promise<MarketResponse | null> {
  const cacheKey = `market:${ticker.toUpperCase()}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const company = await prisma.company.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: {
      marketSnapshot: true,
      marketData: {
        orderBy: { date: 'desc' },
        take: 252 * 7,
      },
    },
  });

  if (!company) return null;

  const snapshot = company.marketSnapshot;
  const priceHistory = company.marketData.reverse().map(p => ({
    date: p.date.toISOString().split('T')[0],
    open: Number(p.open),
    high: Number(p.high),
    low: Number(p.low),
    close: Number(p.close),
    volume: Number(p.volume),
    adjustedClose: Number(p.adjustedClose),
  }));

  const response: MarketResponse = {
    snapshot: {
      ticker: company.ticker,
      price: snapshot ? Number(snapshot.price) : 0,
      change: snapshot ? Number(snapshot.change) : 0,
      changePercent: snapshot ? Number(snapshot.changePercent) : 0,
      marketCap: snapshot?.marketCap ? Number(snapshot.marketCap) : null,
      sharesOutstanding: snapshot?.sharesOutstanding ? Number(snapshot.sharesOutstanding) : null,
      peRatio: snapshot?.peRatio ? Number(snapshot.peRatio) : null,
      pbRatio: snapshot?.pbRatio ? Number(snapshot.pbRatio) : null,
      beta: snapshot?.beta ? Number(snapshot.beta) : null,
      fiftyTwoWeekHigh: snapshot?.fiftyTwoWeekHigh ? Number(snapshot.fiftyTwoWeekHigh) : null,
      fiftyTwoWeekLow: snapshot?.fiftyTwoWeekLow ? Number(snapshot.fiftyTwoWeekLow) : null,
      avgVolume: snapshot?.avgVolume ? Number(snapshot.avgVolume) : null,
      dividendYield: snapshot?.dividendYield ? Number(snapshot.dividendYield) : null,
      volume: snapshot?.avgVolume ? Number(snapshot.avgVolume) : null,
      updatedAt: snapshot ? snapshot.updatedAt.toISOString() : new Date().toISOString(),
    },
    priceHistory,
  };

  await redis.setex(cacheKey, MARKET_CACHE_TTL, JSON.stringify(response));
  return response;
}

export async function getLatestPrice(ticker: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  const cacheKey = `price:${ticker.toUpperCase()}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const company = await prisma.company.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: { marketSnapshot: true },
  });

  const snapshot = company?.marketSnapshot;

  if (!snapshot) return null;

  const result = {
    price: Number(snapshot.price),
    change: Number(snapshot.change),
    changePercent: Number(snapshot.changePercent),
  };

  await redis.setex(cacheKey, 30, JSON.stringify(result));
  return result;
}