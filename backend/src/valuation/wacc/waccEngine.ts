import { prisma } from '@config/database';
import { redis } from '@config/redis';
import { WaccResponse } from '@api/schemas/valuation';
import { logger } from '@config/logger';

const WACC_CACHE_TTL = 3600;
const DEFAULT_RISK_FREE_RATE = 0.042;
const DEFAULT_EQUITY_RISK_PREMIUM = 0.045;

async function getRiskFreeRate(): Promise<number> {
  const cached = await redis.get('wacc:risk-free-rate');
  if (cached) return Number(cached);
  return DEFAULT_RISK_FREE_RATE;
}

async function getEquityRiskPremium(): Promise<number> {
  const cached = await redis.get('wacc:equity-risk-premium');
  if (cached) return Number(cached);
  return DEFAULT_EQUITY_RISK_PREMIUM;
}

async function getBeta(ticker: string): Promise<number> {
  const cacheKey = `wacc:beta:${ticker.toUpperCase()}`;
  const cached = await redis.get(cacheKey);
  if (cached) return Number(cached);

  const company = await prisma.company.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: { marketSnapshot: true },
  });

  const beta = company?.marketSnapshot?.beta ? Number(company.marketSnapshot.beta) : 1.0;
  await redis.setex(cacheKey, WACC_CACHE_TTL, String(beta));
  return beta;
}

async function getCostOfDebt(ticker: string): Promise<{ preTax: number; afterTax: number; taxRate: number }> {
  const cacheKey = `wacc:cost-of-debt:${ticker.toUpperCase()}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const company = await prisma.company.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: {
      financials: {
        orderBy: { periodEnd: 'desc' },
        take: 1,
        include: { income: true, balance: true },
      },
    },
  });

  const latestPeriod = company?.financials[0];
  const income = latestPeriod?.income;
  const balance = latestPeriod?.balance;

  const interestExpense = income?.interestExpense ? Number(income.interestExpense) : 0;
  const totalDebt = balance?.totalDebt ? Number(balance.totalDebt) : 0;
  const pretaxIncome = income?.pretaxIncome ? Number(income.pretaxIncome) : 0;
  const taxExpense = income?.taxExpense ? Number(income.taxExpense) : 0;

  const preTaxCostOfDebt = totalDebt > 0 ? interestExpense / totalDebt : 0.045;
  const taxRate = pretaxIncome > 0 ? taxExpense / pretaxIncome : 0.21;
  const afterTaxCostOfDebt = preTaxCostOfDebt * (1 - Math.min(Math.max(taxRate, 0), 1));

  const result = { preTax: preTaxCostOfDebt, afterTax: afterTaxCostOfDebt, taxRate: Math.min(Math.max(taxRate, 0), 1) };
  await redis.setex(cacheKey, WACC_CACHE_TTL, JSON.stringify(result));
  return result;
}

async function getCapitalStructure(ticker: string): Promise<{ equityWeight: number; debtWeight: number; equityValue: number; debtValue: number }> {
  const cacheKey = `wacc:capital-structure:${ticker.toUpperCase()}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const company = await prisma.company.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: {
      marketSnapshot: true,
      financials: {
        orderBy: { periodEnd: 'desc' },
        take: 1,
        include: { balance: true },
      },
    },
  });

  const marketCap = company?.marketSnapshot?.marketCap ? Number(company.marketSnapshot.marketCap) : 0;
  const totalDebt = company?.financials[0]?.balance?.totalDebt ? Number(company.financials[0].balance.totalDebt) : 0;

  const totalValue = marketCap + totalDebt;
  const equityWeight = totalValue > 0 ? marketCap / totalValue : 1;
  const debtWeight = totalValue > 0 ? totalDebt / totalValue : 0;

  const result = { equityWeight, debtWeight, equityValue: marketCap, debtValue: totalDebt };
  await redis.setex(cacheKey, WACC_CACHE_TTL, JSON.stringify(result));
  return result;
}

export async function calculateWacc(ticker: string): Promise<WaccResponse> {
  const cacheKey = `wacc:${ticker.toUpperCase()}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const [riskFreeRate, equityRiskPremium, beta, costOfDebt, capitalStructure] = await Promise.all([
    getRiskFreeRate(),
    getEquityRiskPremium(),
    getBeta(ticker),
    getCostOfDebt(ticker),
    getCapitalStructure(ticker),
  ]);

  const costOfEquity = riskFreeRate + beta * equityRiskPremium;
  const wacc = capitalStructure.equityWeight * costOfEquity + capitalStructure.debtWeight * costOfDebt.afterTax;

  const result: WaccResponse = {
    riskFreeRate,
    beta,
    equityRiskPremium,
    costOfEquity,
    preTaxCostOfDebt: costOfDebt.preTax,
    taxRate: costOfDebt.taxRate,
    afterTaxCostOfDebt: costOfDebt.afterTax,
    equityWeight: capitalStructure.equityWeight,
    debtWeight: capitalStructure.debtWeight,
    wacc,
  };

  await redis.setex(cacheKey, WACC_CACHE_TTL, JSON.stringify(result));
  return result;
}