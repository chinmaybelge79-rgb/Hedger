import { Worker, Job } from 'bullmq';
import { marketRefreshQueue, financialRefreshQueue, valuationRefreshQueue, MarketRefreshJobData, FinancialRefreshJobData, ValuationRefreshJobData } from './queues';
import { providerRegistry } from '@providers/base';
import { prisma } from '@config/database';
import { logger } from '@config/logger';
import { getEnv } from '@config/env';

const env = getEnv();

async function refreshMarketData(ticker: string): Promise<void> {
  const startTime = Date.now();
  const provider = providerRegistry.getAll()[0];
  if (!provider) {
    logger.warn({ ticker }, 'No provider available for market refresh');
    return;
  }

  try {
    const marketData = await provider.getMarketData(ticker);
    if (!marketData) {
      logger.warn({ ticker }, 'No market data returned from provider');
      return;
    }

    let company = await prisma.company.findUnique({ where: { ticker: ticker.toUpperCase() } });
    if (!company) {
      const companyData = await provider.getCompany(ticker);
      if (!companyData) return;
      company = await prisma.company.create({ data: companyData });
    }

    await prisma.marketSnapshot.upsert({
      where: { companyId: company.id },
      update: {
        price: marketData.price,
        change: marketData.change,
        changePercent: marketData.changePercent,
        marketCap: marketData.marketCap,
        sharesOutstanding: marketData.sharesOutstanding,
        peRatio: marketData.peRatio,
        pbRatio: marketData.pbRatio,
        beta: marketData.beta,
        fiftyTwoWeekHigh: marketData.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: marketData.fiftyTwoWeekLow,
        avgVolume: marketData.avgVolume,
        dividendYield: marketData.dividendYield,
      },
      create: {
        companyId: company.id,
        price: marketData.price,
        change: marketData.change,
        changePercent: marketData.changePercent,
        marketCap: marketData.marketCap,
        sharesOutstanding: marketData.sharesOutstanding,
        peRatio: marketData.peRatio,
        pbRatio: marketData.pbRatio,
        beta: marketData.beta,
        fiftyTwoWeekHigh: marketData.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: marketData.fiftyTwoWeekLow,
        avgVolume: marketData.avgVolume,
        dividendYield: marketData.dividendYield,
      },
    });

    for (const point of marketData.priceHistory) {
      await prisma.marketPrice.upsert({
        where: { companyId_date: { companyId: company.id, date: new Date(point.date) } },
        update: { open: point.open, high: point.high, low: point.low, close: point.close, volume: point.volume, adjustedClose: point.adjustedClose, source: provider.name },
        create: { companyId: company.id, date: new Date(point.date), open: point.open, high: point.high, low: point.low, close: point.close, volume: point.volume, adjustedClose: point.adjustedClose, source: provider.name },
      });
    }

    logger.info({ ticker, durationMs: Date.now() - startTime }, 'Market data refreshed');
  } catch (error) {
    logger.error({ ticker, err: error }, 'Market refresh failed');
    throw error;
  }
}

async function refreshFinancialData(ticker: string): Promise<void> {
  const startTime = Date.now();
  const provider = providerRegistry.getAll()[0];
  if (!provider) return;

  try {
    let company = await prisma.company.findUnique({ where: { ticker: ticker.toUpperCase() } });
    if (!company) {
      const companyData = await provider.getCompany(ticker);
      if (!companyData) return;
      company = await prisma.company.create({ data: companyData });
    }

    const periods = ['2024-FY', '2023-FY', '2022-FY', '2021-FY', '2020-FY'];

    for (const period of periods) {
      const [income, balance, cashflow, shares] = await Promise.all([
        provider.getIncomeStatement(ticker, period),
        provider.getBalanceSheet(ticker, period),
        provider.getCashFlow(ticker, period),
        provider.getShares(ticker, period),
      ]);

      if (!income && !balance && !cashflow) continue;

      const periodEnd = new Date(period.replace('-FY', '-12-31').replace('-Q1', '-03-31').replace('-Q2', '-06-30').replace('-Q3', '-09-30').replace('-Q4', '-12-31'));

      const financialPeriod = await prisma.financialPeriod.upsert({
        where: { companyId_period: { companyId: company.id, period } },
        update: { periodEnd, reportDate: new Date(), source: provider.name },
        create: { companyId: company.id, period, fiscalYear: periodEnd.getFullYear(), periodEnd, reportDate: new Date(), source: provider.name },
      });

      if (income) {
        await prisma.incomeStatement.upsert({
          where: { periodId: financialPeriod.id },
          update: {
            revenue: BigInt(Math.round(income.revenue)),
            costOfRevenue: BigInt(Math.round(income.costOfRevenue)),
            grossProfit: BigInt(Math.round(income.grossProfit)),
            operatingExpense: BigInt(Math.round(income.operatingExpense)),
            sellingGeneralAdmin: BigInt(Math.round(income.sellingGeneralAdmin)),
            researchDevelopment: BigInt(Math.round(income.researchDevelopment)),
            operatingIncome: BigInt(Math.round(income.operatingIncome)),
            interestExpense: BigInt(Math.round(income.interestExpense)),
            interestIncome: BigInt(Math.round(income.interestIncome)),
            otherIncomeExpense: BigInt(Math.round(income.otherIncomeExpense)),
            pretaxIncome: BigInt(Math.round(income.pretaxIncome)),
            taxExpense: BigInt(Math.round(income.taxExpense)),
            netIncome: BigInt(Math.round(income.netIncome)),
            dilutedEPS: income.dilutedEPS,
            basicEPS: income.basicEPS,
            sharesDiluted: BigInt(Math.round(income.sharesDiluted)),
            sharesBasic: BigInt(Math.round(income.sharesBasic)),
          },
          create: {
            periodId: financialPeriod.id,
            revenue: BigInt(Math.round(income.revenue)),
            costOfRevenue: BigInt(Math.round(income.costOfRevenue)),
            grossProfit: BigInt(Math.round(income.grossProfit)),
            operatingExpense: BigInt(Math.round(income.operatingExpense)),
            sellingGeneralAdmin: BigInt(Math.round(income.sellingGeneralAdmin)),
            researchDevelopment: BigInt(Math.round(income.researchDevelopment)),
            operatingIncome: BigInt(Math.round(income.operatingIncome)),
            interestExpense: BigInt(Math.round(income.interestExpense)),
            interestIncome: BigInt(Math.round(income.interestIncome)),
            otherIncomeExpense: BigInt(Math.round(income.otherIncomeExpense)),
            pretaxIncome: BigInt(Math.round(income.pretaxIncome)),
            taxExpense: BigInt(Math.round(income.taxExpense)),
            netIncome: BigInt(Math.round(income.netIncome)),
            dilutedEPS: income.dilutedEPS,
            basicEPS: income.basicEPS,
            sharesDiluted: BigInt(Math.round(income.sharesDiluted)),
            sharesBasic: BigInt(Math.round(income.sharesBasic)),
          },
        });
      }

      if (balance) {
        await prisma.balanceSheet.upsert({
          where: { periodId: financialPeriod.id },
          update: {
            cashAndEquivalents: BigInt(Math.round(balance.cashAndEquivalents)),
            marketableSecurities: BigInt(Math.round(balance.marketableSecurities)),
            accountsReceivable: BigInt(Math.round(balance.accountsReceivable)),
            inventory: BigInt(Math.round(balance.inventory)),
            currentAssets: BigInt(Math.round(balance.currentAssets)),
            propertyPlantEquipment: BigInt(Math.round(balance.propertyPlantEquipment)),
            goodwill: BigInt(Math.round(balance.goodwill)),
            intangibleAssets: BigInt(Math.round(balance.intangibleAssets)),
            totalAssets: BigInt(Math.round(balance.totalAssets)),
            accountsPayable: BigInt(Math.round(balance.accountsPayable)),
            currentLiabilities: BigInt(Math.round(balance.currentLiabilities)),
            shortTermDebt: BigInt(Math.round(balance.shortTermDebt)),
            longTermDebt: BigInt(Math.round(balance.longTermDebt)),
            totalDebt: BigInt(Math.round(balance.totalDebt)),
            totalLiabilities: BigInt(Math.round(balance.totalLiabilities)),
            shareholdersEquity: BigInt(Math.round(balance.shareholdersEquity)),
            retainedEarnings: BigInt(Math.round(balance.retainedEarnings)),
            treasuryStock: BigInt(Math.round(balance.treasuryStock)),
          },
          create: {
            periodId: financialPeriod.id,
            cashAndEquivalents: BigInt(Math.round(balance.cashAndEquivalents)),
            marketableSecurities: BigInt(Math.round(balance.marketableSecurities)),
            accountsReceivable: BigInt(Math.round(balance.accountsReceivable)),
            inventory: BigInt(Math.round(balance.inventory)),
            currentAssets: BigInt(Math.round(balance.currentAssets)),
            propertyPlantEquipment: BigInt(Math.round(balance.propertyPlantEquipment)),
            goodwill: BigInt(Math.round(balance.goodwill)),
            intangibleAssets: BigInt(Math.round(balance.intangibleAssets)),
            totalAssets: BigInt(Math.round(balance.totalAssets)),
            accountsPayable: BigInt(Math.round(balance.accountsPayable)),
            currentLiabilities: BigInt(Math.round(balance.currentLiabilities)),
            shortTermDebt: BigInt(Math.round(balance.shortTermDebt)),
            longTermDebt: BigInt(Math.round(balance.longTermDebt)),
            totalDebt: BigInt(Math.round(balance.totalDebt)),
            totalLiabilities: BigInt(Math.round(balance.totalLiabilities)),
            shareholdersEquity: BigInt(Math.round(balance.shareholdersEquity)),
            retainedEarnings: BigInt(Math.round(balance.retainedEarnings)),
            treasuryStock: BigInt(Math.round(balance.treasuryStock)),
          },
        });
      }

      if (cashflow) {
        await prisma.cashFlowStatement.upsert({
          where: { periodId: financialPeriod.id },
          update: {
            netIncome: BigInt(Math.round(cashflow.netIncome)),
            depreciationAmortization: BigInt(Math.round(cashflow.depreciationAmortization)),
            stockBasedCompensation: BigInt(Math.round(cashflow.stockBasedCompensation)),
            changeInWorkingCapital: BigInt(Math.round(cashflow.changeInWorkingCapital)),
            operatingCashFlow: BigInt(Math.round(cashflow.operatingCashFlow)),
            capitalExpenditure: BigInt(Math.round(cashflow.capitalExpenditure)),
            acquisitions: BigInt(Math.round(cashflow.acquisitions)),
            investingCashFlow: BigInt(Math.round(cashflow.investingCashFlow)),
            debtIssued: BigInt(Math.round(cashflow.debtIssued)),
            debtRepaid: BigInt(Math.round(cashflow.debtRepaid)),
            shareRepurchases: BigInt(Math.round(cashflow.shareRepurchases)),
            dividendsPaid: BigInt(Math.round(cashflow.dividendsPaid)),
            financingCashFlow: BigInt(Math.round(cashflow.financingCashFlow)),
            freeCashFlow: BigInt(Math.round(cashflow.freeCashFlow)),
            freeCashFlowPerShare: cashflow.freeCashFlowPerShare,
          },
          create: {
            periodId: financialPeriod.id,
            netIncome: BigInt(Math.round(cashflow.netIncome)),
            depreciationAmortization: BigInt(Math.round(cashflow.depreciationAmortization)),
            stockBasedCompensation: BigInt(Math.round(cashflow.stockBasedCompensation)),
            changeInWorkingCapital: BigInt(Math.round(cashflow.changeInWorkingCapital)),
            operatingCashFlow: BigInt(Math.round(cashflow.operatingCashFlow)),
            capitalExpenditure: BigInt(Math.round(cashflow.capitalExpenditure)),
            acquisitions: BigInt(Math.round(cashflow.acquisitions)),
            investingCashFlow: BigInt(Math.round(cashflow.investingCashFlow)),
            debtIssued: BigInt(Math.round(cashflow.debtIssued)),
            debtRepaid: BigInt(Math.round(cashflow.debtRepaid)),
            shareRepurchases: BigInt(Math.round(cashflow.shareRepurchases)),
            dividendsPaid: BigInt(Math.round(cashflow.dividendsPaid)),
            financingCashFlow: BigInt(Math.round(cashflow.financingCashFlow)),
            freeCashFlow: BigInt(Math.round(cashflow.freeCashFlow)),
            freeCashFlowPerShare: cashflow.freeCashFlowPerShare,
          },
        });
      }

      if (shares) {
        await prisma.shareData.upsert({
          where: { periodId: financialPeriod.id },
          update: { sharesOutstanding: BigInt(Math.round(shares.sharesOutstanding)), sharesDiluted: BigInt(Math.round(shares.sharesDiluted)), sharePrice: shares.sharePrice },
          create: { periodId: financialPeriod.id, sharesOutstanding: BigInt(Math.round(shares.sharesOutstanding)), sharesDiluted: BigInt(Math.round(shares.sharesDiluted)), sharePrice: shares.sharePrice },
        });
      }
    }

    logger.info({ ticker, durationMs: Date.now() - startTime }, 'Financial data refreshed');
  } catch (error) {
    logger.error({ ticker, err: error }, 'Financial refresh failed');
    throw error;
  }
}

async function refreshValuation(ticker: string, model: string): Promise<void> {
  logger.info({ ticker, model }, 'Valuation refresh triggered');
}

export function initializeJobWorkers(): void {
  new Worker('market-refresh', async (job: Job<MarketRefreshJobData>) => {
    await refreshMarketData(job.data.ticker);
  }, { connection: marketRefreshQueue.opts.connection, concurrency: env.VALUATION_JOB_CONCURRENCY });

  new Worker('financial-refresh', async (job: Job<FinancialRefreshJobData>) => {
    await refreshFinancialData(job.data.ticker);
  }, { connection: financialRefreshQueue.opts.connection, concurrency: 2 });

  new Worker('valuation-refresh', async (job: Job<ValuationRefreshJobData>) => {
    await refreshValuation(job.data.ticker, job.data.model);
  }, { connection: valuationRefreshQueue.opts.connection, concurrency: env.VALUATION_JOB_CONCURRENCY });

  logger.info('Job workers initialized');
}