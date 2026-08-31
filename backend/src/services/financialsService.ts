import { prisma } from '@config/database';
import { redis } from '@config/redis';
import { FinancialsResponse, FinancialsQuery } from '@api/schemas/financials';
import { logger } from '@config/logger';

const FINANCIALS_CACHE_TTL = 3600;

function mapIncomeStatement(income: any, period: any) {
  return {
    period: period.period,
    periodEnd: period.periodEnd.toISOString(),
    revenue: income.revenue ? Number(income.revenue) : null,
    costOfRevenue: income.costOfRevenue ? Number(income.costOfRevenue) : null,
    grossProfit: income.grossProfit ? Number(income.grossProfit) : null,
    operatingExpense: income.operatingExpense ? Number(income.operatingExpense) : null,
    sellingGeneralAdmin: income.sellingGeneralAdmin ? Number(income.sellingGeneralAdmin) : null,
    researchDevelopment: income.researchDevelopment ? Number(income.researchDevelopment) : null,
    operatingIncome: income.operatingIncome ? Number(income.operatingIncome) : null,
    interestExpense: income.interestExpense ? Number(income.interestExpense) : null,
    interestIncome: income.interestIncome ? Number(income.interestIncome) : null,
    otherIncomeExpense: income.otherIncomeExpense ? Number(income.otherIncomeExpense) : null,
    pretaxIncome: income.pretaxIncome ? Number(income.pretaxIncome) : null,
    taxExpense: income.taxExpense ? Number(income.taxExpense) : null,
    netIncome: income.netIncome ? Number(income.netIncome) : null,
    dilutedEPS: income.dilutedEPS ? Number(income.dilutedEPS) : null,
    basicEPS: income.basicEPS ? Number(income.basicEPS) : null,
    sharesDiluted: income.sharesDiluted ? Number(income.sharesDiluted) : null,
    sharesBasic: income.sharesBasic ? Number(income.sharesBasic) : null,
  };
}

function mapBalanceSheet(balance: any, period: any) {
  return {
    period: period.period,
    periodEnd: period.periodEnd.toISOString(),
    cashAndEquivalents: balance.cashAndEquivalents ? Number(balance.cashAndEquivalents) : null,
    marketableSecurities: balance.marketableSecurities ? Number(balance.marketableSecurities) : null,
    accountsReceivable: balance.accountsReceivable ? Number(balance.accountsReceivable) : null,
    inventory: balance.inventory ? Number(balance.inventory) : null,
    currentAssets: balance.currentAssets ? Number(balance.currentAssets) : null,
    propertyPlantEquipment: balance.propertyPlantEquipment ? Number(balance.propertyPlantEquipment) : null,
    goodwill: balance.goodwill ? Number(balance.goodwill) : null,
    intangibleAssets: balance.intangibleAssets ? Number(balance.intangibleAssets) : null,
    totalAssets: balance.totalAssets ? Number(balance.totalAssets) : null,
    accountsPayable: balance.accountsPayable ? Number(balance.accountsPayable) : null,
    currentLiabilities: balance.currentLiabilities ? Number(balance.currentLiabilities) : null,
    shortTermDebt: balance.shortTermDebt ? Number(balance.shortTermDebt) : null,
    longTermDebt: balance.longTermDebt ? Number(balance.longTermDebt) : null,
    totalDebt: balance.totalDebt ? Number(balance.totalDebt) : null,
    totalLiabilities: balance.totalLiabilities ? Number(balance.totalLiabilities) : null,
    shareholdersEquity: balance.shareholdersEquity ? Number(balance.shareholdersEquity) : null,
    retainedEarnings: balance.retainedEarnings ? Number(balance.retainedEarnings) : null,
    treasuryStock: balance.treasuryStock ? Number(balance.treasuryStock) : null,
  };
}

function mapCashFlow(cashflow: any, period: any) {
  return {
    period: period.period,
    periodEnd: period.periodEnd.toISOString(),
    netIncome: cashflow.netIncome ? Number(cashflow.netIncome) : null,
    depreciationAmortization: cashflow.depreciationAmortization ? Number(cashflow.depreciationAmortization) : null,
    stockBasedCompensation: cashflow.stockBasedCompensation ? Number(cashflow.stockBasedCompensation) : null,
    changeInWorkingCapital: cashflow.changeInWorkingCapital ? Number(cashflow.changeInWorkingCapital) : null,
    operatingCashFlow: cashflow.operatingCashFlow ? Number(cashflow.operatingCashFlow) : null,
    capitalExpenditure: cashflow.capitalExpenditure ? Number(cashflow.capitalExpenditure) : null,
    acquisitions: cashflow.acquisitions ? Number(cashflow.acquisitions) : null,
    investingCashFlow: cashflow.investingCashFlow ? Number(cashflow.investingCashFlow) : null,
    debtIssued: cashflow.debtIssued ? Number(cashflow.debtIssued) : null,
    debtRepaid: cashflow.debtRepaid ? Number(cashflow.debtRepaid) : null,
    shareRepurchases: cashflow.shareRepurchases ? Number(cashflow.shareRepurchases) : null,
    dividendsPaid: cashflow.dividendsPaid ? Number(cashflow.dividendsPaid) : null,
    financingCashFlow: cashflow.financingCashFlow ? Number(cashflow.financingCashFlow) : null,
    freeCashFlow: cashflow.freeCashFlow ? Number(cashflow.freeCashFlow) : null,
    freeCashFlowPerShare: cashflow.freeCashFlowPerShare ? Number(cashflow.freeCashFlowPerShare) : null,
  };
}

function mapDerivedMetrics(derived: any, period: any) {
  return {
    period: period.period,
    revenueGrowth: derived.revenueGrowth ? Number(derived.revenueGrowth) : null,
    grossMargin: derived.grossMargin ? Number(derived.grossMargin) : null,
    ebitMargin: derived.ebitMargin ? Number(derived.ebitMargin) : null,
    ebitdaMargin: derived.ebitdaMargin ? Number(derived.ebitdaMargin) : null,
    netMargin: derived.netMargin ? Number(derived.netMargin) : null,
    roe: derived.roe ? Number(derived.roe) : null,
    roic: derived.roic ? Number(derived.roic) : null,
    roa: derived.roa ? Number(derived.roa) : null,
    fcfMargin: derived.fcfMargin ? Number(derived.fcfMargin) : null,
    fcfConversion: derived.fcfConversion ? Number(derived.fcfConversion) : null,
    debtToEbitda: derived.debtToEbitda ? Number(derived.debtToEbitda) : null,
    netDebtToEbitda: derived.netDebtToEbitda ? Number(derived.netDebtToEbitda) : null,
    currentRatio: derived.currentRatio ? Number(derived.currentRatio) : null,
    quickRatio: derived.quickRatio ? Number(derived.quickRatio) : null,
    assetTurnover: derived.assetTurnover ? Number(derived.assetTurnover) : null,
    workingCapital: derived.workingCapital ? Number(derived.workingCapital) : null,
    epsGrowth: derived.epsGrowth ? Number(derived.epsGrowth) : null,
    bookValueGrowth: derived.bookValueGrowth ? Number(derived.bookValueGrowth) : null,
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

  const periods = company.financials;

  const incomeStatement = periods.map(p => mapIncomeStatement(p.income, p)).filter(p => p.revenue !== null);
  const balanceSheet = periods.map(p => mapBalanceSheet(p.balance, p)).filter(p => p.totalAssets !== null);
  const cashFlow = periods.map(p => mapCashFlow(p.cashflow, p)).filter(p => p.operatingCashFlow !== null);
  const derivedMetrics = periods.map(p => mapDerivedMetrics(p.derived, p)).filter(p => p.revenueGrowth !== null);

  const response: FinancialsResponse = {
    incomeStatement,
    balanceSheet,
    cashFlow,
    derivedMetrics,
  };

  await redis.setex(cacheKey, FINANCIALS_CACHE_TTL, JSON.stringify(response));
  return response;
}