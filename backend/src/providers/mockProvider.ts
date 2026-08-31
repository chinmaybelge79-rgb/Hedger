import { FinancialDataProvider, CompanyData, MarketData, IncomeStatementData, BalanceSheetData, CashFlowData, ShareData } from './base';

const MOCK_COMPANIES: Record<string, CompanyData> = {
  'AAPL': { ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Technology', industry: 'Consumer Electronics' },
  'MSFT': { ticker: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Technology', industry: 'Software' },
  'GOOGL': { ticker: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Technology', industry: 'Internet Services' },
  'NVDA': { ticker: 'NVDA', name: 'NVIDIA Corp.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Semiconductors', industry: 'Semiconductors' },
  'TSLA': { ticker: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Consumer', industry: 'Auto Manufacturers' },
  'AMZN': { ticker: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Technology', industry: 'E-Commerce' },
  'META': { ticker: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Technology', industry: 'Internet Services' },
  'JPM': { ticker: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', country: 'US', currency: 'USD', sector: 'Financials', industry: 'Banks' },
};

const MOCK_PRICES: Record<string, number> = {
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

export class MockProvider implements FinancialDataProvider {
  name = 'mock';

  async getCompany(ticker: string): Promise<CompanyData | null> {
    return MOCK_COMPANIES[ticker.toUpperCase()] || null;
  }

  async getMarketData(ticker: string): Promise<MarketData | null> {
    const company = MOCK_COMPANIES[ticker.toUpperCase()];
    const price = MOCK_PRICES[ticker.toUpperCase()];
    if (!company || !price) return null;

    return {
      price,
      change: (Math.random() - 0.5) * 5,
      changePercent: (Math.random() - 0.5) * 3,
      marketCap: price * 1000000000,
      sharesOutstanding: 1000000000,
      peRatio: 20 + Math.random() * 20,
      pbRatio: 3 + Math.random() * 5,
      beta: 0.8 + Math.random() * 0.5,
      fiftyTwoWeekHigh: price * 1.2,
      fiftyTwoWeekLow: price * 0.7,
      avgVolume: 50000000,
      dividendYield: Math.random() * 0.03,
      priceHistory: generatePriceHistory(price),
    };
  }

  async getIncomeStatement(ticker: string, period: string): Promise<IncomeStatementData | null> {
    const price = MOCK_PRICES[ticker.toUpperCase()];
    if (!price) return null;

    const revenue = price * 10000000;
    return {
      period,
      periodEnd: new Date(),
      revenue,
      costOfRevenue: revenue * 0.4,
      grossProfit: revenue * 0.6,
      operatingExpense: revenue * 0.25,
      sellingGeneralAdmin: revenue * 0.15,
      researchDevelopment: revenue * 0.1,
      operatingIncome: revenue * 0.35,
      interestExpense: revenue * 0.01,
      interestIncome: revenue * 0.005,
      otherIncomeExpense: 0,
      pretaxIncome: revenue * 0.345,
      taxExpense: revenue * 0.07,
      netIncome: revenue * 0.275,
      dilutedEPS: price * 0.5,
      basicEPS: price * 0.5,
      sharesDiluted: 1000000000,
      sharesBasic: 1000000000,
    };
  }

  async getBalanceSheet(ticker: string, period: string): Promise<BalanceSheetData | null> {
    const price = MOCK_PRICES[ticker.toUpperCase()];
    if (!price) return null;

    const totalAssets = price * 20000000;
    return {
      period,
      periodEnd: new Date(),
      cashAndEquivalents: totalAssets * 0.1,
      marketableSecurities: totalAssets * 0.05,
      accountsReceivable: totalAssets * 0.08,
      inventory: totalAssets * 0.05,
      currentAssets: totalAssets * 0.3,
      propertyPlantEquipment: totalAssets * 0.2,
      goodwill: totalAssets * 0.15,
      intangibleAssets: totalAssets * 0.1,
      totalAssets,
      accountsPayable: totalAssets * 0.05,
      currentLiabilities: totalAssets * 0.15,
      shortTermDebt: totalAssets * 0.03,
      longTermDebt: totalAssets * 0.12,
      totalDebt: totalAssets * 0.15,
      totalLiabilities: totalAssets * 0.4,
      shareholdersEquity: totalAssets * 0.6,
      retainedEarnings: totalAssets * 0.3,
      treasuryStock: totalAssets * 0.05,
    };
  }

  async getCashFlow(ticker: string, period: string): Promise<CashFlowData | null> {
    const price = MOCK_PRICES[ticker.toUpperCase()];
    if (!price) return null;

    const netIncome = price * 2750000;
    return {
      period,
      periodEnd: new Date(),
      netIncome,
      depreciationAmortization: netIncome * 0.1,
      stockBasedCompensation: netIncome * 0.05,
      changeInWorkingCapital: -netIncome * 0.02,
      operatingCashFlow: netIncome * 1.15,
      capitalExpenditure: -netIncome * 0.2,
      acquisitions: -netIncome * 0.1,
      investingCashFlow: -netIncome * 0.3,
      debtIssued: netIncome * 0.1,
      debtRepaid: -netIncome * 0.15,
      shareRepurchases: -netIncome * 0.3,
      dividendsPaid: -netIncome * 0.05,
      financingCashFlow: -netIncome * 0.4,
      freeCashFlow: netIncome * 0.95,
      freeCashFlowPerShare: price * 0.45,
    };
  }

  async getShares(ticker: string, period: string): Promise<ShareData | null> {
    const price = MOCK_PRICES[ticker.toUpperCase()];
    if (!price) return null;

    return {
      period,
      periodEnd: new Date(),
      sharesOutstanding: 1000000000,
      sharesDiluted: 1000000000,
      sharePrice: price,
    };
  }

  async searchCompanies(query: string): Promise<Array<{ symbol: string; name: string; exchange: string; type: string; currency: string }>> {
    const upperQuery = query.toUpperCase();
    return Object.entries(MOCK_COMPANIES)
      .filter(([sym, c]) => sym.includes(upperQuery) || c.name.toUpperCase().includes(upperQuery))
      .map(([sym, c]) => ({ symbol: sym, name: c.name, exchange: c.exchange, type: 'EQUITY', currency: c.currency }));
  }
}