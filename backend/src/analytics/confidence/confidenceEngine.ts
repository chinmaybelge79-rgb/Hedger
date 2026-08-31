import { prisma } from '@config/database';
import { ConfidenceResponse } from '@api/schemas/confidence';

export async function calculateConfidence(ticker: string): Promise<ConfidenceResponse> {
  const company = await prisma.company.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: {
      financials: {
        orderBy: { periodEnd: 'desc' },
        take: 8,
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

  const financials = company.financials;
  const valuations = company.valuations;

  let dataQuality = 50;
  let modelAgreement = 50;
  let assumptionStability = 50;
  let financialQuality = 50;

  if (financials.length >= 5) dataQuality += 20;
  else if (financials.length >= 3) dataQuality += 10;

  const latestPeriod = financials[0];
  const hasIncome = !!latestPeriod?.income;
  const hasBalance = !!latestPeriod?.balance;
  const hasCashflow = !!latestPeriod?.cashflow;
  const hasDerived = !!latestPeriod?.derived;

  if (hasIncome && hasBalance && hasCashflow && hasDerived) dataQuality += 20;
  else if (hasIncome && hasBalance && hasCashflow) dataQuality += 15;
  else if (hasIncome && hasBalance) dataQuality += 10;

  const periods = financials.filter(f => f.income && f.balance && f.cashflow);
  if (periods.length >= 3) {
    const revenues = periods.map(p => p.income?.revenue ? Number(p.income.revenue) : 0).filter(r => r > 0);
    if (revenues.length >= 3) {
      const growthRates = revenues.slice(1).map((r, i) => (r - revenues[i]) / revenues[i]);
      const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
      const volatility = Math.sqrt(growthRates.reduce((sum, g) => sum + Math.pow(g - avgGrowth, 2), 0) / growthRates.length);
      if (volatility < 0.1) assumptionStability += 25;
      else if (volatility < 0.2) assumptionStability += 15;
      else assumptionStability += 5;
    }
  }

  const valuationModels = valuations.map(v => v.model);
  const uniqueModels = new Set(valuationModels);
  if (uniqueModels.size >= 4) modelAgreement = 85;
  else if (uniqueModels.size >= 3) modelAgreement = 70;
  else if (uniqueModels.size >= 2) modelAgreement = 50;
  else modelAgreement = 30;

  const latest = financials[0];
  const derived = latest?.derived;
  if (derived) {
    const roe = derived.roe ? Number(derived.roe) : 0;
    const roic = derived.roic ? Number(derived.roic) : 0;
    const fcfMargin = derived.fcfMargin ? Number(derived.fcfMargin) : 0;
    const debtToEbitda = derived.debtToEbitda ? Number(derived.debtToEbitda) : 10;

    let fqScore = 0;
    if (roe > 0.15) fqScore += 25;
    else if (roe > 0.1) fqScore += 15;
    else if (roe > 0.05) fqScore += 10;

    if (roic > 0.15) fqScore += 25;
    else if (roic > 0.1) fqScore += 15;
    else if (roic > 0.05) fqScore += 10;

    if (fcfMargin > 0.15) fqScore += 25;
    else if (fcfMargin > 0.1) fqScore += 15;
    else if (fcfMargin > 0.05) fqScore += 10;

    if (debtToEbitda < 2) fqScore += 25;
    else if (debtToEbitda < 3) fqScore += 15;
    else if (debtToEbitda < 4) fqScore += 10;

    financialQuality = Math.min(100, fqScore);
  }

  const score = Math.round((dataQuality + modelAgreement + assumptionStability + financialQuality) / 4);
  let grade: 'High' | 'Medium' | 'Low';
  if (score >= 75) grade = 'High';
  else if (score >= 50) grade = 'Medium';
  else grade = 'Low';

  return {
    score,
    grade,
    components: { dataQuality, modelAgreement, assumptionStability, financialQuality },
  };
}