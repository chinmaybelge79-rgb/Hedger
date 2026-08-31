import { PrismaClient, Decimal } from '@prisma/client';

const prisma = new PrismaClient();

const companies = [
  { ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Technology', industry: 'Consumer Electronics', cik: '0000320193' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Technology', industry: 'Software', cik: '0000789019' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Technology', industry: 'Internet Services', cik: '0001652044' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Semiconductors', industry: 'Semiconductors', cik: '0001045810' },
  { ticker: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Consumer', industry: 'Auto Manufacturers', cik: '0001318605' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Technology', industry: 'E-Commerce', cik: '0001018724' },
  { ticker: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Technology', industry: 'Internet Services', cik: '0001326801' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', country: 'US', currency: 'USD', sector: 'Financials', industry: 'Banks', cik: '0000019617' },
];

const mockPrices: Record<string, number> = {
  'AAPL': 198.72, 'MSFT': 412.34, 'GOOGL': 162.48, 'NVDA': 842.18, 'TSLA': 248.50, 'AMZN': 178.30, 'META': 485.20, 'JPM': 195.80,
};

function generatePriceHistory(basePrice: number, volatility: number = 0.02, days: number = 252 * 7) {
  const history = [];
  let price = basePrice * 0.3;
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const drift = (basePrice - price) / days * 0.1;
    const shock = (Math.random() - 0.5) * 2 * volatility * price;
    price = Math.max(0.01, price + drift + shock);
    
    const open = price * (1 + (Math.random() - 0.5) * 0.01);
    const high = Math.max(open, price) * (1 + Math.random() * 0.02);
    const low = Math.min(open, price) * (1 - Math.random() * 0.02);
    const close = price;
    const volume = Math.floor(Math.random() * 100000000) + 10000000;
    
    history.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
      adjustedClose: Math.round(close * 100) / 100,
    });
  }
  return history;
}

function generateFinancials(basePrice: number, ticker: string) {
  const revenue = basePrice * 10000000;
  const costOfRevenue = revenue * 0.4;
  const grossProfit = revenue * 0.6;
  const operatingExpense = revenue * 0.25;
  const sellingGeneralAdmin = revenue * 0.15;
  const researchDevelopment = revenue * 0.1;
  const operatingIncome = revenue * 0.35;
  const interestExpense = revenue * 0.01;
  const interestIncome = revenue * 0.005;
  const pretaxIncome = revenue * 0.345;
  const taxExpense = revenue * 0.07;
  const netIncome = revenue * 0.275;
  const dilutedEPS = basePrice * 0.5;
  const basicEPS = basePrice * 0.5;
  const sharesDiluted = 1000000000;
  const sharesBasic = 1000000000;
  
  const totalAssets = basePrice * 20000000;
  const cashAndEquivalents = totalAssets * 0.1;
  const marketableSecurities = totalAssets * 0.05;
  const accountsReceivable = totalAssets * 0.08;
  const inventory = totalAssets * 0.05;
  const currentAssets = totalAssets * 0.3;
  const propertyPlantEquipment = totalAssets * 0.2;
  const goodwill = totalAssets * 0.15;
  const intangibleAssets = totalAssets * 0.1;
  const accountsPayable = totalAssets * 0.05;
  const currentLiabilities = totalAssets * 0.15;
  const shortTermDebt = totalAssets * 0.03;
  const longTermDebt = totalAssets * 0.12;
  const totalDebt = totalAssets * 0.15;
  const totalLiabilities = totalAssets * 0.4;
  const shareholdersEquity = totalAssets * 0.6;
  const retainedEarnings = totalAssets * 0.3;
  const treasuryStock = totalAssets * 0.05;
  
  const netIncome_ = netIncome;
  const depreciationAmortization = netIncome_ * 0.1;
  const stockBasedCompensation = netIncome_ * 0.05;
  const changeInWorkingCapital = -netIncome_ * 0.02;
  const operatingCashFlow = netIncome_ * 1.15;
  const capitalExpenditure = -netIncome_ * 0.2;
  const acquisitions = -netIncome_ * 0.1;
  const investingCashFlow = -netIncome_ * 0.3;
  const debtIssued = netIncome_ * 0.1;
  const debtRepaid = -netIncome_ * 0.15;
  const shareRepurchases = -netIncome_ * 0.3;
  const dividendsPaid = -netIncome_ * 0.05;
  const financingCashFlow = -netIncome_ * 0.4;
  const freeCashFlow = netIncome_ * 0.95;
  const freeCashFlowPerShare = basePrice * 0.45;
  
  const revenueGrowth = 0.08;
  const grossMargin = 0.6;
  const ebitMargin = 0.35;
  const ebitdaMargin = 0.4;
  const netMargin = 0.275;
  const roe = 0.25;
  const roic = 0.22;
  const roa = 0.15;
  const fcfMargin = 0.25;
  const fcfConversion = 0.9;
  const debtToEbitda = 1.5;
  const netDebtToEbitda = 1.0;
  const currentRatio = 2.0;
  const quickRatio = 1.8;
  const assetTurnover = 0.5;
  const workingCapital = totalAssets * 0.15;
  const epsGrowth = 0.12;
  const bookValueGrowth = 0.1;
  
  return {
    income: {
      revenue: Math.round(revenue),
      costOfRevenue: Math.round(costOfRevenue),
      grossProfit: Math.round(grossProfit),
      operatingExpense: Math.round(operatingExpense),
      sellingGeneralAdmin: Math.round(sellingGeneralAdmin),
      researchDevelopment: Math.round(researchDevelopment),
      operatingIncome: Math.round(operatingIncome),
      interestExpense: Math.round(interestExpense),
      interestIncome: Math.round(interestIncome),
      otherIncomeExpense: 0,
      pretaxIncome: Math.round(pretaxIncome),
      taxExpense: Math.round(taxExpense),
      netIncome: Math.round(netIncome),
      dilutedEPS: Math.round(dilutedEPS * 100) / 100,
      basicEPS: Math.round(basicEPS * 100) / 100,
      sharesDiluted: sharesDiluted,
      sharesBasic: sharesBasic,
    },
    balance: {
      cashAndEquivalents: Math.round(cashAndEquivalents),
      marketableSecurities: Math.round(marketableSecurities),
      accountsReceivable: Math.round(accountsReceivable),
      inventory: Math.round(inventory),
      currentAssets: Math.round(currentAssets),
      propertyPlantEquipment: Math.round(propertyPlantEquipment),
      goodwill: Math.round(goodwill),
      intangibleAssets: Math.round(intangibleAssets),
      totalAssets: Math.round(totalAssets),
      accountsPayable: Math.round(accountsPayable),
      currentLiabilities: Math.round(currentLiabilities),
      shortTermDebt: Math.round(shortTermDebt),
      longTermDebt: Math.round(longTermDebt),
      totalDebt: Math.round(totalDebt),
      totalLiabilities: Math.round(totalLiabilities),
      shareholdersEquity: Math.round(shareholdersEquity),
      retainedEarnings: Math.round(retainedEarnings),
      treasuryStock: Math.round(treasuryStock),
    },
    cashflow: {
      netIncome: Math.round(netIncome_),
      depreciationAmortization: Math.round(depreciationAmortization),
      stockBasedCompensation: Math.round(stockBasedCompensation),
      changeInWorkingCapital: Math.round(changeInWorkingCapital),
      operatingCashFlow: Math.round(operatingCashFlow),
      capitalExpenditure: Math.round(capitalExpenditure),
      acquisitions: Math.round(acquisitions),
      investingCashFlow: Math.round(investingCashFlow),
      debtIssued: Math.round(debtIssued),
      debtRepaid: Math.round(debtRepaid),
      shareRepurchases: Math.round(shareRepurchases),
      dividendsPaid: Math.round(dividendsPaid),
      financingCashFlow: Math.round(financingCashFlow),
      freeCashFlow: Math.round(freeCashFlow),
      freeCashFlowPerShare: Math.round(freeCashFlowPerShare * 100) / 100,
    },
    shares: {
      sharesOutstanding: sharesDiluted,
      sharesDiluted: sharesDiluted,
      sharePrice: basePrice,
    },
    derived: {
      revenueGrowth,
      grossMargin,
      ebitMargin,
      ebitdaMargin,
      netMargin,
      roe,
      roic,
      roa,
      fcfMargin,
      fcfConversion,
      debtToEbitda,
      netDebtToEbitda,
      currentRatio,
      quickRatio,
      assetTurnover,
      workingCapital: Math.round(workingCapital),
      epsGrowth,
      bookValueGrowth,
    },
  };
}

async function main() {
  console.log('Seeding companies...');
  const createdCompanies: Record<string, { id: string; ticker: string }> = {};
  
  for (const c of companies) {
    const company = await prisma.company.upsert({
      where: { ticker: c.ticker },
      update: c,
      create: c,
    });
    createdCompanies[c.ticker] = { id: company.id, ticker: c.ticker };
  }
  console.log('Seeded companies');

  console.log('Seeding financial data, market data, and price history...');
  
  for (const c of companies) {
    const basePrice = mockPrices[c.ticker] || 100;
    const companyId = createdCompanies[c.ticker].id;
    
    const financials = generateFinancials(basePrice, c.ticker);
    const priceHistory = generatePriceHistory(basePrice);
    
    const periodEnd = new Date('2024-12-31');
    const period = '2024-FY';
    
    // Create financial period
    const financialPeriod = await prisma.financialPeriod.upsert({
      where: {
        companyId_period: {
          companyId: companyId,
          period: period,
        },
      },
      update: {
        fiscalYear: 2024,
        fiscalQuarter: null,
        periodEnd,
        reportDate: periodEnd,
        source: 'MOCK',
      },
      create: {
        companyId: companyId,
        period,
        fiscalYear: 2024,
        fiscalQuarter: null,
        periodEnd,
        reportDate: periodEnd,
        source: 'MOCK',
      },
    });
    
    // Create income statement
    await prisma.incomeStatement.upsert({
      where: { periodId: financialPeriod.id },
      update: financials.income,
      create: {
        periodId: financialPeriod.id,
        ...financials.income,
      },
    });
    
    // Create balance sheet
    await prisma.balanceSheet.upsert({
      where: { periodId: financialPeriod.id },
      update: financials.balance,
      create: {
        periodId: financialPeriod.id,
        ...financials.balance,
      },
    });
    
    // Create cash flow statement
    await prisma.cashFlowStatement.upsert({
      where: { periodId: financialPeriod.id },
      update: financials.cashflow,
      create: {
        periodId: financialPeriod.id,
        ...financials.cashflow,
      },
    });
    
    // Create shares data
    await prisma.shareData.upsert({
      where: { periodId: financialPeriod.id },
      update: financials.shares,
      create: {
        periodId: financialPeriod.id,
        ...financials.shares,
      },
    });
    
    // Create derived metrics
    await prisma.derivedMetrics.upsert({
      where: { periodId: financialPeriod.id },
      update: financials.derived,
      create: {
        periodId: financialPeriod.id,
        ...financials.derived,
      },
    });
    
    // Create market snapshot
    await prisma.marketSnapshot.upsert({
      where: { companyId: companyId },
      update: {
        price: new Decimal(basePrice),
        change: new Decimal((Math.random() - 0.5) * 5),
        changePercent: new Decimal((Math.random() - 0.5) * 3),
        marketCap: basePrice * 1000000000,
        sharesOutstanding: 1000000000,
        peRatio: new Decimal(20 + Math.random() * 20),
        pbRatio: new Decimal(3 + Math.random() * 5),
        beta: new Decimal(0.8 + Math.random() * 0.5),
        fiftyTwoWeekHigh: new Decimal(basePrice * 1.2),
        fiftyTwoWeekLow: new Decimal(basePrice * 0.7),
        avgVolume: 50000000,
        dividendYield: new Decimal(Math.random() * 0.03),
      },
      create: {
        companyId: companyId,
        price: new Decimal(basePrice),
        change: new Decimal((Math.random() - 0.5) * 5),
        changePercent: new Decimal((Math.random() - 0.5) * 3),
        marketCap: basePrice * 1000000000,
        sharesOutstanding: 1000000000,
        peRatio: new Decimal(20 + Math.random() * 20),
        pbRatio: new Decimal(3 + Math.random() * 5),
        beta: new Decimal(0.8 + Math.random() * 0.5),
        fiftyTwoWeekHigh: new Decimal(basePrice * 1.2),
        fiftyTwoWeekLow: new Decimal(basePrice * 0.7),
        avgVolume: 50000000,
        dividendYield: new Decimal(Math.random() * 0.03),
      },
    });
    
    // Create price history (sample every ~10 days to keep it manageable)
    for (let i = 0; i < priceHistory.length; i += 10) {
      const p = priceHistory[i];
      await prisma.marketPrice.upsert({
        where: {
          companyId_date: {
            companyId: companyId,
            date: new Date(p.date),
          },
        },
        update: {
          open: new Decimal(p.open),
          high: new Decimal(p.high),
          low: new Decimal(p.low),
          close: new Decimal(p.close),
          volume: p.volume,
          adjustedClose: new Decimal(p.adjustedClose),
          source: 'MOCK',
        },
        create: {
          companyId: companyId,
          date: new Date(p.date),
          open: new Decimal(p.open),
          high: new Decimal(p.high),
          low: new Decimal(p.low),
          close: new Decimal(p.close),
          volume: p.volume,
          adjustedClose: new Decimal(p.adjustedClose),
          source: 'MOCK',
        },
      });
    }
    
    console.log(`Seeded ${c.ticker} with financials, market data, and ${priceHistory.length/10} price points`);
  }
  
  console.log('Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());