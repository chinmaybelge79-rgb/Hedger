import { prisma } from '@config/database';
import { CompsInput, CompsResponse } from '@api/schemas/comps';
import { logger } from '@config/logger';

const SECTOR_PEERS: Record<string, string[]> = {
  'Technology': ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'ADBE', 'CRM', 'ORCL', 'INTC', 'CSCO'],
  'Semiconductors': ['NVDA', 'AMD', 'INTC', 'AVGO', 'QCOM', 'TXN', 'AMAT', 'MU', 'KLAC', 'LRCX'],
  'Healthcare': ['JNJ', 'PFE', 'MRK', 'ABBV', 'LLY', 'TMO', 'UNH', 'ABT', 'DHR', 'BMY'],
  'Financials': ['JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'V', 'MA', 'AXP', 'BLK'],
  'Consumer': ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE', 'SBUX', 'TGT', 'LOW', 'COST', 'WMT'],
  'Energy': ['XOM', 'CVX', 'COP', 'EOG', 'SLB', 'PSX', 'VLO', 'MPC', 'OXY', 'HAL'],
  'Industrials': ['HON', 'UPS', 'CAT', 'BA', 'GE', 'MMM', 'LMT', 'RTX', 'DE', 'EMR'],
};

async function getPeerMetrics(tickers: string[]) {
  const companies = await prisma.company.findMany({
    where: { ticker: { in: tickers } },
    include: {
      marketSnapshot: true,
      financials: {
        orderBy: { periodEnd: 'desc' },
        take: 1,
        include: { income: true, balance: true, cashflow: true, shares: true },
      },
    },
  });

  return companies.map(c => {
    const snapshot = c.marketSnapshot;
    const latest = c.financials[0];
    const income = latest?.income;
    const balance = latest?.balance;
    const cashflow = latest?.cashflow;

    const marketCap = snapshot?.marketCap ? Number(snapshot.marketCap) : 0;
    const totalDebt = balance?.totalDebt ? Number(balance.totalDebt) : 0;
    const cash = balance?.cashAndEquivalents ? Number(balance.cashAndEquivalents) : 0;
    const securities = balance?.marketableSecurities ? Number(balance.marketableSecurities) : 0;
    const enterpriseValue = marketCap + totalDebt - cash - securities;

    const revenue = income?.revenue ? Number(income.revenue) : 0;
    const ebitda = income?.operatingIncome ? Number(income.operatingIncome) + (cashflow?.depreciationAmortization ? Number(cashflow.depreciationAmortization) : 0) : 0;
    const ebit = income?.operatingIncome ? Number(income.operatingIncome) : 0;
    const netIncome = income?.netIncome ? Number(income.netIncome) : 0;
    const fcf = cashflow?.freeCashFlow ? Number(cashflow.freeCashFlow) : 0;

    return {
      ticker: c.ticker,
      name: c.name,
      evRevenue: revenue > 0 ? enterpriseValue / revenue : null,
      evEbitda: ebitda > 0 ? enterpriseValue / ebitda : null,
      evEbit: ebit > 0 ? enterpriseValue / ebit : null,
      pe: netIncome > 0 && snapshot?.price ? Number(snapshot.price) / (netIncome / (latest?.shares?.sharesOutstanding ? Number(latest.shares.sharesOutstanding) : 1)) : null,
      pFcf: fcf > 0 && snapshot?.price ? marketCap / fcf : null,
      evFcf: fcf > 0 ? enterpriseValue / fcf : null,
    };
  });
}

function median(arr: (number | null)[]): number | null {
  const valid = arr.filter((v): v is number => v !== null && !isNaN(v) && isFinite(v)).sort((a, b) => a - b);
  if (valid.length === 0) return null;
  const mid = Math.floor(valid.length / 2);
  return valid.length % 2 === 0 ? (valid[mid - 1] + valid[mid]) / 2 : valid[mid];
}

export async function calculateComps(ticker: string, input: CompsInput): Promise<CompsResponse> {
  const targetCompany = await prisma.company.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: {
      marketSnapshot: true,
      financials: {
        orderBy: { periodEnd: 'desc' },
        take: 1,
        include: { income: true, balance: true, cashflow: true, shares: true },
      },
    },
  });

  if (!targetCompany) {
    throw new Error(`Company ${ticker} not found`);
  }

  const sector = targetCompany.sector || 'Technology';
  const defaultPeers = SECTOR_PEERS[sector] || SECTOR_PEERS['Technology'];
  const peers = input.peers || defaultPeers.filter(p => p !== ticker.toUpperCase()).slice(0, 10);

  const peerMetrics = await getPeerMetrics(peers);

  const medianMultiples = {
    evRevenue: median(peerMetrics.map(p => p.evRevenue)),
    evEbitda: median(peerMetrics.map(p => p.evEbitda)),
    evEbit: median(peerMetrics.map(p => p.evEbit)),
    pe: median(peerMetrics.map(p => p.pe)),
    pFcf: median(peerMetrics.map(p => p.pFcf)),
    evFcf: median(peerMetrics.map(p => p.evFcf)),
  };

  const latest = targetCompany.financials[0];
  const income = latest?.income;
  const balance = latest?.balance;
  const cashflow = latest?.cashflow;

  const revenue = income?.revenue ? Number(income.revenue) : 0;
  const ebitda = income?.operatingIncome ? Number(income.operatingIncome) + (cashflow?.depreciationAmortization ? Number(cashflow.depreciationAmortization) : 0) : 0;
  const ebit = income?.operatingIncome ? Number(income.operatingIncome) : 0;
  const netIncome = income?.netIncome ? Number(income.netIncome) : 0;
  const fcf = cashflow?.freeCashFlow ? Number(cashflow.freeCashFlow) : 0;

  const impliedEvs = [
    medianMultiples.evRevenue ? medianMultiples.evRevenue * revenue : null,
    medianMultiples.evEbitda ? medianMultiples.evEbitda * ebitda : null,
    medianMultiples.evEbit ? medianMultiples.evEbit * ebit : null,
  ].filter((v): v is number => v !== null);

  const impliedEV = impliedEvs.length > 0 ? impliedEvs.reduce((a, b) => a + b, 0) / impliedEvs.length : 0;

  const totalDebt = balance?.totalDebt ? Number(balance.totalDebt) : 0;
  const cash = balance?.cashAndEquivalents ? Number(balance.cashAndEquivalents) : 0;
  const securities = balance?.marketableSecurities ? Number(balance.marketableSecurities) : 0;
  const netDebt = totalDebt - cash - securities;

  const impliedEquity = impliedEV - netDebt;
  const sharesOutstanding = targetCompany.marketSnapshot?.sharesOutstanding ? Number(targetCompany.marketSnapshot.sharesOutstanding) : 1;
  const fairValuePerShare = impliedEquity / sharesOutstanding;
  const currentPrice = targetCompany.marketSnapshot?.price ? Number(targetCompany.marketSnapshot.price) : 0;
  const upside = currentPrice > 0 ? (fairValuePerShare - currentPrice) / currentPrice : 0;

  return {
    targetTicker: ticker.toUpperCase(),
    peerGroup: peerMetrics,
    medianMultiples,
    impliedEV,
    impliedEquity,
    fairValuePerShare,
    currentPrice,
    upside,
  };
}