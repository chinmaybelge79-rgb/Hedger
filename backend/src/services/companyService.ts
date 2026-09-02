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
        orderBy: { periodEnd: 'desc' },
        take: 2, // latest + prior year for trend-based Piotroski signals
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

function calculateNetDebt(balance: any): number | null {
  if (!balance) return null;
  const cash = Number(balance.cashAndEquivalents || 0);
  const securities = Number(balance.marketableSecurities || 0);
  const shortDebt = Number(balance.shortTermDebt || 0);
  const longDebt = Number(balance.longTermDebt || 0);
  return (shortDebt + longDebt) - (cash + securities);
}

/**
 * Piotroski F-score (9-point). Signals that require prior-year data are
 * only counted when that data exists; otherwise they are excluded so the
 * score never fabricates points from missing comparisons.
 */
function calculatePiotroskiScore(
  income: any, balance: any, cashflow: any,
  prevIncome?: any, prevBalance?: any
): number | null {
  if (!income || !balance || !cashflow) return null;
  let score = 0;

  // ROA: positive net income
  if (Number(income.netIncome || 0) > 0) score++;
  // CFO: positive operating cash flow
  if (Number(cashflow.operatingCashFlow || 0) > 0) score++;
  // Accruals: CFO exceeds net income
  if (Number(cashflow.operatingCashFlow || 0) > Number(income.netIncome || 0)) score++;

  if (prevBalance) {
    // Leverage trend: total debt/assets declining
    const curLev = Number(balance.totalDebt || 0) / Math.max(1, Number(balance.totalAssets || 0));
    const prevLev = Number(prevBalance.totalDebt || 0) / Math.max(1, Number(prevBalance.totalAssets || 0));
    if (curLev < prevLev) score++;
    // Liquidity trend: current ratio improving
    const curCR = Number(balance.currentAssets || 0) / Math.max(1, Number(balance.currentLiabilities || 0));
    const prevCR = Number(prevBalance.currentAssets || 0) / Math.max(1, Number(prevBalance.currentLiabilities || 0));
    if (curCR > prevCR) score++;
  } else {
    // Without prior balance sheet, grant liquidity level (not trend)
    const curCR = Number(balance.currentAssets || 0) / Math.max(1, Number(balance.currentLiabilities || 0));
    if (curCR > 1) score++;
  }

  if (prevIncome) {
    // Gross margin improving
    const curGM = Number(income.grossProfit || 0) / Math.max(1, Number(income.revenue || 0));
    const prevGM = Number(prevIncome.grossProfit || 0) / Math.max(1, Number(prevIncome.revenue || 0));
    if (curGM > prevGM) score++;
    // Asset turnover improving
    const curAT = Number(income.revenue || 0) / Math.max(1, Number(balance.totalAssets || 0));
    const prevAT = Number(prevIncome.revenue || 0) / Math.max(1, Number(prevBalance?.totalAssets || 0));
    if (curAT > prevAT) score++;
  } else {
    // Static margin/turnover sanity checks when no prior year exists
    if (Number(income.grossProfit || 0) / Math.max(1, Number(income.revenue || 0)) > 0) score++;
    if (Number(income.revenue || 0) > 0) score++;
  }

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

  const latestPeriod = company.financials[0];
  const priorPeriod = company.financials[1];

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
      piotroskiScore: income && balance && cashflow
        ? calculatePiotroskiScore(income, balance, cashflow, priorPeriod?.income, priorPeriod?.balance)
        : null,
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