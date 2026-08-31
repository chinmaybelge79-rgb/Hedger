export interface CompanyData {
  ticker: string;
  name: string;
  exchange: string;
  country: string;
  currency: string;
  sector?: string;
  industry?: string;
  description?: string;
  cik?: string;
  lei?: string;
  website?: string;
  logoUrl?: string;
}

export interface MarketData {
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  sharesOutstanding?: number;
  peRatio?: number;
  pbRatio?: number;
  beta?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  avgVolume?: number;
  dividendYield?: number;
  priceHistory: Array<{ date: string; open: number; high: number; low: number; close: number; volume: number; adjustedClose: number }>;
}

export interface IncomeStatementData {
  period: string;
  periodEnd: Date;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingExpense: number;
  sellingGeneralAdmin: number;
  researchDevelopment: number;
  operatingIncome: number;
  interestExpense: number;
  interestIncome: number;
  otherIncomeExpense: number;
  pretaxIncome: number;
  taxExpense: number;
  netIncome: number;
  dilutedEPS: number;
  basicEPS: number;
  sharesDiluted: number;
  sharesBasic: number;
}

export interface BalanceSheetData {
  period: string;
  periodEnd: Date;
  cashAndEquivalents: number;
  marketableSecurities: number;
  accountsReceivable: number;
  inventory: number;
  currentAssets: number;
  propertyPlantEquipment: number;
  goodwill: number;
  intangibleAssets: number;
  totalAssets: number;
  accountsPayable: number;
  currentLiabilities: number;
  shortTermDebt: number;
  longTermDebt: number;
  totalDebt: number;
  totalLiabilities: number;
  shareholdersEquity: number;
  retainedEarnings: number;
  treasuryStock: number;
}

export interface CashFlowData {
  period: string;
  periodEnd: Date;
  netIncome: number;
  depreciationAmortization: number;
  stockBasedCompensation: number;
  changeInWorkingCapital: number;
  operatingCashFlow: number;
  capitalExpenditure: number;
  acquisitions: number;
  investingCashFlow: number;
  debtIssued: number;
  debtRepaid: number;
  shareRepurchases: number;
  dividendsPaid: number;
  financingCashFlow: number;
  freeCashFlow: number;
  freeCashFlowPerShare: number;
}

export interface ShareData {
  period: string;
  periodEnd: Date;
  sharesOutstanding: number;
  sharesDiluted: number;
  sharePrice: number;
}

export interface FinancialDataProvider {
  name: string;
  getCompany(ticker: string): Promise<CompanyData | null>;
  getMarketData(ticker: string): Promise<MarketData | null>;
  getIncomeStatement(ticker: string, period: string): Promise<IncomeStatementData | null>;
  getBalanceSheet(ticker: string, period: string): Promise<BalanceSheetData | null>;
  getCashFlow(ticker: string, period: string): Promise<CashFlowData | null>;
  getShares(ticker: string, period: string): Promise<ShareData | null>;
  searchCompanies(query: string): Promise<Array<{ symbol: string; name: string; exchange: string; type: string; currency: string }>>;
}

export class ProviderRegistry {
  private providers: FinancialDataProvider[] = [];

  register(provider: FinancialDataProvider): void {
    this.providers.push(provider);
  }

  getAll(): FinancialDataProvider[] {
    return this.providers;
  }

  getByName(name: string): FinancialDataProvider | undefined {
    return this.providers.find(p => p.name === name);
  }

  async getCompany(ticker: string): Promise<CompanyData | null> {
    for (const provider of this.providers) {
      try {
        const result = await provider.getCompany(ticker);
        if (result) return result;
      } catch (e) {
        console.error(`Provider ${provider.name} failed for getCompany:`, e);
      }
    }
    return null;
  }

  async getMarketData(ticker: string): Promise<MarketData | null> {
    for (const provider of this.providers) {
      try {
        const result = await provider.getMarketData(ticker);
        if (result) return result;
      } catch (e) {
        console.error(`Provider ${provider.name} failed for getMarketData:`, e);
      }
    }
    return null;
  }
}

export const providerRegistry = new ProviderRegistry();