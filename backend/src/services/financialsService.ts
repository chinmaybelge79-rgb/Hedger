import { prisma } from '@config/database';
import { redis } from '@config/redis';
import { FinancialsResponse, FinancialsQuery } from '@api/schemas/financials';
import { logger } from '@config/logger';

const FINANCIALS_CACHE_TTL = 3600;

function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return isFinite(n) ? n : null;
}

function mapIncomeStatement(income: any, period: any) {
  return {
    period: period.period,
    periodEnd: period.periodEnd.toISOString(),
    revenue: toNum(income.revenue),
    costOfRevenue: toNum(income.costOfRevenue),
    grossProfit: toNum(income.grossProfit),
    operatingExpense: toNum(income.operatingExpense),
    sellingGeneralAdmin: toNum(income.sellingGeneralAdmin),
    researchDevelopment: toNum(income.researchDevelopment),
    operatingIncome: toNum(income.operatingIncome),
    interestExpense: toNum(income.interestExpense),
    interestIncome: toNum(income.interestIncome),
    otherIncomeExpense: toNum(income.otherIncomeExpense),
    pretaxIncome: toNum(income.pretaxIncome),
    taxExpense: toNum(income.taxExpense),
    netIncome: toNum(income.netIncome),
    dilutedEPS: toNum(income.dilutedEPS),
    basicEPS: toNum(income.basicEPS),
    sharesDiluted: toNum(income.sharesDiluted),
    sharesBasic: toNum(income.sharesBasic),
  };
}

function mapBalanceSheet(balance: any, period: any) {
  return {
    period: period.period,
    periodEnd: period.periodEnd.toISOString(),
    cashAndEquivalents: toNum(balance.cashAndEquivalents),
    marketableSecurities: toNum(balance.marketableSecurities),
    accountsReceivable: toNum(balance.accountsReceivable),
    inventory: toNum(balance.inventory),
    currentAssets: toNum(balance.currentAssets),
    propertyPlantEquipment: toNum(balance.propertyPlantEquipment),
    goodwill: toNum(balance.goodwill),
    intangibleAssets: toNum(balance.intangibleAssets),
    totalAssets: toNum(balance.totalAssets),
    accountsPayable: toNum(balance.accountsPayable),
    currentLiabilities: toNum(balance.currentLiabilities),
    shortTermDebt: toNum(balance.shortTermDebt),
    longTermDebt: toNum(balance.longTermDebt),
    totalDebt: toNum(balance.totalDebt),
    totalLiabilities: toNum(balance.totalLiabilities),
    shareholdersEquity: toNum(balance.shareholdersEquity),
    retainedEarnings: toNum(balance.retainedEarnings),
    treasuryStock: toNum(balance.treasuryStock),
  };
}

function mapCashFlow(cashflow: any, period: any) {
  return {
    period: period.period,
    periodEnd: period.periodEnd.toISOString(),
    netIncome: toNum(cashflow.netIncome),
    depreciationAmortization: toNum(cashflow.depreciationAmortization),
    stockBasedCompensation: toNum(cashflow.stockBasedCompensation),
    changeInWorkingCapital: toNum(cashflow.changeInWorkingCapital),
    operatingCashFlow: toNum(cashflow.operatingCashFlow),
    capitalExpenditure: toNum(cashflow.capitalExpenditure),
    acquisitions: toNum(cashflow.acquisitions),
    investingCashFlow: toNum(cashflow.investingCashFlow),
    debtIssued: toNum(cashflow.debtIssued),
    debtRepaid: toNum(cashflow.debtRepaid),
    shareRepurchases: toNum(cashflow.shareRepurchases),
    dividendsPaid: toNum(cashflow.dividendsPaid),
    financingCashFlow: toNum(cashflow.financingCashFlow),
    freeCashFlow: toNum(cashflow.freeCashFlow),
    freeCashFlowPerShare: toNum(cashflow.freeCashFlowPerShare),
  };
}

function mapDerivedMetrics(derived: any, period: any) {
  return {
    period: period.period,
    revenueGrowth: toNum(derived.revenueGrowth),
    grossMargin: toNum(derived.grossMargin),
    ebitMargin: toNum(derived.ebitMargin),
    ebitdaMargin: toNum(derived.ebitdaMargin),
    netMargin: toNum(derived.netMargin),
    roe: toNum(derived.roe),
    roic: toNum(derived.roic),
    roa: toNum(derived.roa),
    fcfMargin: toNum(derived.fcfMargin),
    fcfConversion: toNum(derived.fcfConversion),
    debtToEbitda: toNum(derived.debtToEbitda),
    netDebtToEbitda: toNum(derived.netDebtToEbitda),
    currentRatio: toNum(derived.currentRatio),
    quickRatio: toNum(derived.quickRatio),
    assetTurnover: toNum(derived.assetTurnover),
    workingCapital: toNum(derived.workingCapital),
    epsGrowth: toNum(derived.epsGrowth),
    bookValueGrowth: toNum(derived.bookValueGrowth),
  };
}

export async function getFinancials(ticker: string, query: FinancialsQuery): Promise<FinancialsResponse | null> {
  const cacheKey = `financials:${ticker.toUpperCase()}:${query.period}:${query.limit}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const company = await prisma.company.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: {
      financials: {
        where: query.period === 'quarterly' ? { period: { contains: 'Q' } } : { period: { endsWith: 'FY' } },
        orderBy: { periodEnd: 'desc' },
        take: query.limit,
        include: {
          income: true,
          balance: true,
          cashflow: true,
          derived: true,
        },
      },
    },
  });

  if (!company) return null;

  // Single pass over periods instead of 4 map+filter chains
  const periods = company.financials;
  const incomeStatement: NonNullable<ReturnType<typeof mapIncomeStatement>>[] = [];
  const balanceSheet: NonNullable<ReturnType<typeof mapBalanceSheet>>[] = [];
  const cashFlow: NonNullable<ReturnType<typeof mapCashFlow>>[] = [];
  const derivedMetrics: NonNullable<ReturnType<typeof mapDerivedMetrics>>[] = [];

  for (const p of periods) {
    if (p.income) incomeStatement.push(mapIncomeStatement(p.income, p));
    if (p.balance) balanceSheet.push(mapBalanceSheet(p.balance, p));
    if (p.cashflow) cashFlow.push(mapCashFlow(p.cashflow, p));
    if (p.derived) derivedMetrics.push(mapDerivedMetrics(p.derived, p));
  }

  const response: FinancialsResponse = {
    incomeStatement,
    balanceSheet,
    cashFlow,
    derivedMetrics,
  };

  await redis.setex(cacheKey, FINANCIALS_CACHE_TTL, JSON.stringify(response));
  return response;
}