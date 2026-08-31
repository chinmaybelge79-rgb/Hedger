export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  currency: string;
}

export interface SearchResponse {
  results: SearchResult[];
}

export interface CompanyIdentity {
  ticker: string;
  name: string;
  exchange: string;
  country: string;
  currency: string;
  sector: string | null;
  industry: string | null;
  description: string | null;
  cik: string | null;
  lei: string | null;
  website: string | null;
  logoUrl: string | null;
}

export interface CompanyMarket {
  price: number;
  change: number;
  changePercent: number;
  marketCap: number | null;
  sharesOutstanding: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  beta: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  avgVolume: number | null;
  dividendYield: number | null;
  updatedAt: string;
}

export interface CompanyFundamentals {
  revenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  dilutedEPS: number | null;
  revenueGrowth: number | null;
  grossMargin: number | null;
  ebitMargin: number | null;
  netMargin: number | null;
  roe: number | null;
  roic: number | null;
  fcfMargin: number | null;
  debtToEbitda: number | null;
  currentRatio: number | null;
}

export interface CompanyCapitalStructure {
  cash: number | null;
  marketableSecurities: number | null;
  shortTermDebt: number | null;
  longTermDebt: number | null;
  totalDebt: number | null;
  netDebt: number | null;
  shareholdersEquity: number | null;
  sharesOutstanding: number | null;
}

export interface CompanyFinancialQuality {
  piotroskiScore: number | null;
  altmanZScore: number | null;
  benevolishMScore: number | null;
  earningsQuality: string | null;
}

export interface CompanyProfile {
  identity: CompanyIdentity;
  market: CompanyMarket;
  fundamentals: CompanyFundamentals;
  capitalStructure: CompanyCapitalStructure;
  financialQuality: CompanyFinancialQuality;
}

export interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose: number;
}

export interface MarketData {
  snapshot: {
    ticker: string;
    price: number;
    change: number;
    changePercent: number;
    marketCap: number | null;
    sharesOutstanding: number | null;
    peRatio: number | null;
    pbRatio: number | null;
    beta: number | null;
    fiftyTwoWeekHigh: number | null;
    fiftyTwoWeekLow: number | null;
    avgVolume: number | null;
    dividendYield: number | null;
    volume: number | null;
    updatedAt: string;
  };
  priceHistory: PricePoint[];
}

export interface FinancialStatementPeriod {
  period: string;
  periodEnd: string;
}

export interface IncomeStatement extends FinancialStatementPeriod {
  revenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  operatingExpense: number | null;
  sellingGeneralAdmin: number | null;
  researchDevelopment: number | null;
  operatingIncome: number | null;
  interestExpense: number | null;
  interestIncome: number | null;
  otherIncomeExpense: number | null;
  pretaxIncome: number | null;
  taxExpense: number | null;
  netIncome: number | null;
  dilutedEPS: number | null;
  basicEPS: number | null;
  sharesDiluted: number | null;
  sharesBasic: number | null;
}

export interface BalanceSheet extends FinancialStatementPeriod {
  cashAndEquivalents: number | null;
  marketableSecurities: number | null;
  accountsReceivable: number | null;
  inventory: number | null;
  currentAssets: number | null;
  propertyPlantEquipment: number | null;
  goodwill: number | null;
  intangibleAssets: number | null;
  totalAssets: number | null;
  accountsPayable: number | null;
  currentLiabilities: number | null;
  shortTermDebt: number | null;
  longTermDebt: number | null;
  totalDebt: number | null;
  totalLiabilities: number | null;
  shareholdersEquity: number | null;
  retainedEarnings: number | null;
  treasuryStock: number | null;
}

export interface CashFlowStatement extends FinancialStatementPeriod {
  netIncome: number | null;
  depreciationAmortization: number | null;
  stockBasedCompensation: number | null;
  changeInWorkingCapital: number | null;
  operatingCashFlow: number | null;
  capitalExpenditure: number | null;
  acquisitions: number | null;
  investingCashFlow: number | null;
  debtIssued: number | null;
  debtRepaid: number | null;
  shareRepurchases: number | null;
  dividendsPaid: number | null;
  financingCashFlow: number | null;
  freeCashFlow: number | null;
  freeCashFlowPerShare: number | null;
}

export interface DerivedMetrics extends FinancialStatementPeriod {
  revenueGrowth: number | null;
  grossMargin: number | null;
  ebitMargin: number | null;
  ebitdaMargin: number | null;
  netMargin: number | null;
  roe: number | null;
  roic: number | null;
  roa: number | null;
  fcfMargin: number | null;
  fcfConversion: number | null;
  debtToEbitda: number | null;
  netDebtToEbitda: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  assetTurnover: number | null;
  workingCapital: number | null;
  epsGrowth: number | null;
  bookValueGrowth: number | null;
}

export interface FinancialsResponse {
  incomeStatement: IncomeStatement[];
  balanceSheet: BalanceSheet[];
  cashFlow: CashFlowStatement[];
  derivedMetrics: DerivedMetrics[];
}

export interface WaccResponse {
  riskFreeRate: number;
  beta: number;
  equityRiskPremium: number;
  costOfEquity: number;
  preTaxCostOfDebt: number;
  taxRate: number;
  afterTaxCostOfDebt: number;
  equityWeight: number;
  debtWeight: number;
  wacc: number;
}

export interface DcfForecast {
  year: number;
  revenue: number;
  ebitda: number;
  ebit: number;
  tax: number;
  nopat: number;
  depreciationAmortization: number;
  capex: number;
  changeInNwc: number;
  fcff: number;
  pvFcff: number;
}

export interface DcfResponse {
  model: 'DCF';
  enterpriseValue: number;
  equityValue: number;
  fairValuePerShare: number;
  currentPrice: number;
  upside: number;
  wacc: number;
  terminalGrowth: number;
  forecast: DcfForecast[];
  terminalValue: number;
  pvTerminalValue: number;
  pvFcff: number;
  netDebt: number;
  sharesOutstanding: number;
}

export interface DcfInput {
  forecastYears: number;
  revenueGrowth: number[];
  ebitMargin: number[];
  taxRate: number;
  wacc: number;
  terminalGrowth: number;
  sharesOutstanding?: number;
  netDebt?: number;
  cash?: number;
}

export interface ReverseDcfResponse {
  impliedRevenueGrowth: number;
  impliedTerminalMargin: number;
  impliedFcfGrowth: number;
  interpretation: string;
}

export interface ReverseDcfInput {
  currentPrice: number;
  wacc: number;
  terminalGrowth: number;
  sharesOutstanding?: number;
  netDebt?: number;
  cash?: number;
}

export interface CompsPeerMetric {
  ticker: string;
  name: string;
  evRevenue: number | null;
  evEbitda: number | null;
  evEbit: number | null;
  pe: number | null;
  pFcf: number | null;
  evFcf: number | null;
}

export interface CompsResponse {
  targetTicker: string;
  peerGroup: CompsPeerMetric[];
  medianMultiples: {
    evRevenue: number | null;
    evEbitda: number | null;
    evEbit: number | null;
    pe: number | null;
    pFcf: number | null;
    evFcf: number | null;
  };
  impliedEV: number;
  impliedEquity: number;
  fairValuePerShare: number;
  currentPrice: number;
  upside: number;
}

export interface SensitivityResponse {
  rows: number[];
  columns: number[];
  values: number[][];
}

export interface ScenarioInput {
  revenueGrowth: number[];
  ebitMargin: number[];
  taxRate: number;
  wacc: number;
  terminalGrowth: number;
}

export interface ScenarioResponse {
  bear: { fairValue: number; upside: number };
  base: { fairValue: number; upside: number };
  bull: { fairValue: number; upside: number };
  weightedValue: number;
}

export interface MonteCarloResponse {
  iterations: number;
  mean: number;
  median: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  distribution: { value: number; count: number }[];
}

export interface RiskResponse {
  overallScore: number;
  businessRisk: number;
  financialRisk: number;
  valuationRisk: number;
  growthRisk: number;
  marginRisk: number;
  leverageRisk: number;
  cashFlowRisk: number;
  marketRisk: number;
  factors: { factor: string; impact: 'low' | 'medium' | 'high'; reason: string }[];
}

export interface ConfidenceResponse {
  score: number;
  grade: 'High' | 'Medium' | 'Low';
  components: {
    dataQuality: number;
    modelAgreement: number;
    assumptionStability: number;
    financialQuality: number;
  };
}

export interface ValuationSummary {
  ticker: string;
  marketPrice: number;
  models: {
    dcf: number;
    reverseDcf: ReverseDcfResponse;
    comps: number;
    sotp: number;
    ddm: number;
    residualIncome: number;
    eva: number;
  };
  consensus: {
    fairValue: number;
    upside: number;
  };
}