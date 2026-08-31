import { prisma } from '@config/database';
import { RiskResponse } from '@api/schemas/risk';

export async function calculateRisk(ticker: string): Promise<RiskResponse> {
  const company = await prisma.company.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: {
      marketSnapshot: true,
      financials: {
        orderBy: { periodEnd: 'desc' },
        take: 5,
        include: { income: true, balance: true, cashflow: true, derived: true },
      },
      valuations: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!company) {
    throw new Error(`Company ${ticker} not found`);
  }

  const latest = company.financials[0];
  const derived = latest?.derived;
  const balance = latest?.balance;
  const income = latest?.income;
  const cashflow = latest?.cashflow;
  const snapshot = company.marketSnapshot;

  const factors: { factor: string; impact: 'low' | 'medium' | 'high'; reason: string }[] = [];

  let businessRisk = 50;
  let financialRisk = 50;
  let valuationRisk = 50;
  let growthRisk = 50;
  let marginRisk = 50;
  let leverageRisk = 50;
  let cashFlowRisk = 50;
  let marketRisk = 50;

  if (derived?.revenueGrowth && Number(derived.revenueGrowth) < 0) {
    growthRisk = 75;
    factors.push({ factor: 'Growth', impact: 'high', reason: 'Revenue is declining year-over-year' });
  } else if (derived?.revenueGrowth && Number(derived.revenueGrowth) < 0.05) {
    growthRisk = 60;
    factors.push({ factor: 'Growth', impact: 'medium', reason: 'Revenue growth is below 5%' });
  } else {
    growthRisk = 30;
  }

  if (derived?.ebitMargin && Number(derived.ebitMargin) < 0.1) {
    marginRisk = 75;
    factors.push({ factor: 'Margin', impact: 'high', reason: 'EBIT margin is below 10%' });
  } else if (derived?.ebitMargin && Number(derived.ebitMargin) < 0.15) {
    marginRisk = 55;
    factors.push({ factor: 'Margin', impact: 'medium', reason: 'EBIT margin is below 15%' });
  } else {
    marginRisk = 25;
  }

  const debtToEbitda = derived?.debtToEbitda ? Number(derived.debtToEbitda) : null;
  if (debtToEbitda && debtToEbitda > 4) {
    leverageRisk = 80;
    financialRisk = 75;
    factors.push({ factor: 'Leverage', impact: 'high', reason: 'Debt/EBITDA exceeds 4x' });
  } else if (debtToEbitda && debtToEbitda > 2.5) {
    leverageRisk = 55;
    financialRisk = 50;
    factors.push({ factor: 'Leverage', impact: 'medium', reason: 'Debt/EBITDA exceeds 2.5x' });
  } else {
    leverageRisk = 25;
    financialRisk = 30;
  }

  const fcfMargin = derived?.fcfMargin ? Number(derived.fcfMargin) : null;
  if (fcfMargin !== null && fcfMargin < 0) {
    cashFlowRisk = 85;
    factors.push({ factor: 'Cash Flow', impact: 'high', reason: 'Negative free cash flow margin' });
  } else if (fcfMargin !== null && fcfMargin < 0.05) {
    cashFlowRisk = 60;
    factors.push({ factor: 'Cash Flow', impact: 'medium', reason: 'FCF margin below 5%' });
  } else {
    cashFlowRisk = 30;
  }

  if (snapshot?.beta && Number(snapshot.beta) > 1.5) {
    marketRisk = 70;
    factors.push({ factor: 'Market', impact: 'high', reason: 'Beta exceeds 1.5, high market sensitivity' });
  } else if (snapshot?.beta && Number(snapshot.beta) > 1.2) {
    marketRisk = 50;
    factors.push({ factor: 'Market', impact: 'medium', reason: 'Beta above 1.2, above-average market sensitivity' });
  } else {
    marketRisk = 30;
  }

  const peRatio = snapshot?.peRatio ? Number(snapshot.peRatio) : null;
  if (peRatio && peRatio > 40) {
    valuationRisk = 80;
    factors.push({ factor: 'Valuation', impact: 'high', reason: 'P/E ratio above 40x' });
  } else if (peRatio && peRatio > 25) {
    valuationRisk = 55;
    factors.push({ factor: 'Valuation', impact: 'medium', reason: 'P/E ratio above 25x' });
  } else {
    valuationRisk = 30;
  }

  const currentRatio = derived?.currentRatio ? Number(derived.currentRatio) : null;
  if (currentRatio && currentRatio < 1) {
    financialRisk = Math.max(financialRisk, 70);
    factors.push({ factor: 'Liquidity', impact: 'high', reason: 'Current ratio below 1.0' });
  }

  if (income?.netIncome && Number(income.netIncome) < 0) {
    businessRisk = Math.max(businessRisk, 70);
    factors.push({ factor: 'Profitability', impact: 'high', reason: 'Negative net income' });
  }

  const overallScore = Math.round(
    (businessRisk * 0.15 + financialRisk * 0.2 + valuationRisk * 0.15 + growthRisk * 0.15 + marginRisk * 0.1 + leverageRisk * 0.1 + cashFlowRisk * 0.1 + marketRisk * 0.05)
  );

  return {
    overallScore,
    businessRisk,
    financialRisk,
    valuationRisk,
    growthRisk,
    marginRisk,
    leverageRisk,
    cashFlowRisk,
    marketRisk,
    factors,
  };
}