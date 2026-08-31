import { prisma } from '@config/database';
import { redis } from '@config/redis';
import { CompanyResponse } from '@api/schemas/company';
import { logger } from '@config/logger';

const COMPANY_CACHE_TTL = 300;

async function getCompanyFromDb(ticker: string) {
  return prisma.company.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: {
      marketSnapshot: true,
      financials: {
        where: { period: { startsWith: '2024' } },
        orderBy: { periodEnd: 'desc' },
        take: 1,
        include: {
          income: true,
          balance: true,
          cashflow: true,
          shares: true,
          derived: true,
        },
      },
    },
  });
}

async function getLatestFinancials(ticker: string) {
  const company = await prisma.company.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: {
      financials: {
        orderBy: { periodEnd: 'desc' },
        take: 1,
        include: {
          income: true,
          balance: true,
          cashflow: true,
          shares: true,
          derived: true,
        },
      },
    },
  });
  return company?.financials[0] || null;
}

function calculateNetDebt(balance: any): number | null {
  if (!balance) return null;
  const cash = Number(balance.cashAndEquivalents || 0);
  const securities = Number(balance.marketableSecurities || 0);
  const shortDebt = Number(balance.shortTermDebt || 0);
  const longDebt = Number(balance.longTermDebt || 0);
  return (shortDebt + longDebt) - (cash + securities);
}

function calculatePiotroskiScore(income: any, balance: any, cashflow: any): number | null {
  if (!income || !balance || !cashflow) return null;
  let score = 0;
  if (Number(income.netIncome || 0) > 0) score++;
  if (Number(cashflow.operatingCashFlow || 0) > 0) score++;
  if (Number(income.operatingIncome || 0) > 0) score++;
  if (Number(cashflow.operatingCashFlow || 0) > Number(income.netIncome || 0)) score++;
  const currentLeverage = Number(balance.totalDebt || 0) / Number(balance.totalAssets || 1);
  const prevLeverage = 0;
  if (currentLeverage < prevLeverage) score++;
  const currentRatio = Number(balance.currentAssets || 0) / Number(balance.currentLiabilities || 1);
  if (currentRatio > 1) score++;
  if (Number(balance.sharesOutstanding || 0) <= Number(balance.sharesOutstanding || 0)) score++;
  if (Number(income.grossProfit || 0) / Number(income.revenue || 1) > 0) score++;
  if (Number(income.operatingIncome || 0) / Number(income.revenue || 1) > 0) score++;
  return score;
}

export async function getCompanyProfile(ticker: string): Promise<CompanyResponse | null> {
  const cacheKey = `company:${ticker.toUpperCase()}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const company = await getCompanyFromDb(ticker);
  if (!company) return null;

  const latestPeriod = await getLatestFinancials(ticker);

  const market = company.marketSnapshot;
  const income = latestPeriod?.income;
  const balance = latestPeriod?.balance;
  const cashflow = latestPeriod?.cashflow;
  const shares = latestPeriod?.shares;
  const derived = latestPeriod?.derived;

  const response: CompanyResponse = {
    identity: {
      ticker: company.ticker,
      name: company.name,
      exchange: company.exchange,
      country: company.country,
      currency: company.currency,
      sector: company.sector,
      industry: company.industry,
      description: company.description,
      cik: company.cik,
      lei: company.lei,
      website: company.website,
      logoUrl: company.logoUrl,
    },
    market: {
      price: market ? Number(market.price) : 0,
      change: market ? Number(market.change) : 0,
      changePercent: market ? Number(market.changePercent) : 0,
      marketCap: market ? (market.marketCap ? Number(market.marketCap) : null) : null,
      sharesOutstanding: market ? (market.sharesOutstanding ? Number(market.sharesOutstanding) : null) : null,
      peRatio: market ? (market.peRatio ? Number(market.peRatio) : null) : null,
      pbRatio: market ? (market.pbRatio ? Number(market.pbRatio) : null) : null,
      beta: market ? (market.beta ? Number(market.beta) : null) : null,
      fiftyTwoWeekHigh: market ? (market.fiftyTwoWeekHigh ? Number(market.fiftyTwoWeekHigh) : null) : null,
      fiftyTwoWeekLow: market ? (market.fiftyTwoWeekLow ? Number(market.fiftyTwoWeekLow) : null) : null,
      avgVolume: market ? (market.avgVolume ? Number(market.avgVolume) : null) : null,
      dividendYield: market ? (market.dividendYield ? Number(market.dividendYield) : null) : null,
      updatedAt: market ? market.updatedAt.toISOString() : new Date().toISOString(),
    },
    fundamentals: {
      revenue: income ? Number(income.revenue || 0) : null,
      grossProfit: income ? Number(income.grossProfit || 0) : null,
      operatingIncome: income ? Number(income.operatingIncome || 0) : null,
      netIncome: income ? Number(income.netIncome || 0) : null,
      dilutedEPS: income ? (income.dilutedEPS ? Number(income.dilutedEPS) : null) : null,
      revenueGrowth: derived ? (derived.revenueGrowth ? Number(derived.revenueGrowth) : null) : null,
      grossMargin: derived ? (derived.grossMargin ? Number(derived.grossMargin) : null) : null,
      ebitMargin: derived ? (derived.ebitMargin ? Number(derived.ebitMargin) : null) : null,
      netMargin: derived ? (derived.netMargin ? Number(derived.netMargin) : null) : null,
      roe: derived ? (derived.roe ? Number(derived.roe) : null) : null,
      roic: derived ? (derived.roic ? Number(derived.roic) : null) : null,
      fcfMargin: derived ? (derived.fcfMargin ? Number(derived.fcfMargin) : null) : null,
      debtToEbitda: derived ? (derived.debtToEbitda ? Number(derived.debtToEbitda) : null) : null,
      currentRatio: derived ? (derived.currentRatio ? Number(derived.currentRatio) : null) : null,
    },
    capitalStructure: {
      cash: balance ? Number(balance.cashAndEquivalents || 0) : null,
      marketableSecurities: balance ? Number(balance.marketableSecurities || 0) : null,
      shortTermDebt: balance ? Number(balance.shortTermDebt || 0) : null,
      longTermDebt: balance ? Number(balance.longTermDebt || 0) : null,
      totalDebt: balance ? Number(balance.totalDebt || 0) : null,
      netDebt: balance ? calculateNetDebt(balance) : null,
      shareholdersEquity: balance ? Number(balance.shareholdersEquity || 0) : null,
      sharesOutstanding: shares ? Number(shares.sharesOutstanding || 0) : null,
    },
    financialQuality: {
      piotroskiScore: income && balance && cashflow ? calculatePiotroskiScore(income, balance, cashflow) : null,
      altmanZScore: null,
      benevolishMScore: null,
      earningsQuality: null,
    },
  };

  await redis.setex(cacheKey, COMPANY_CACHE_TTL, JSON.stringify(response));
  return response;
}

export async function getCompanyPriceHistory(ticker: string, years: number = 7): Promise<Array<{ date: string; close: number }>> {
  const cacheKey = `price-history:${ticker.toUpperCase()}:${years}y`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - years);

  const prices = await prisma.marketPrice.findMany({
    where: {
      company: { ticker: ticker.toUpperCase() },
      date: { gte: startDate },
    },
    orderBy: { date: 'asc' },
    select: { date: true, close: true },
  });

  const result = prices.map(p => ({ date: p.date.toISOString().split('T')[0], close: Number(p.close) }));
  await redis.setex(cacheKey, 60, JSON.stringify(result));
  return result;
}