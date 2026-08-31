import { DcfInput, DcfResponse } from '@api/schemas/valuation';
import { calculateWacc } from '../wacc/waccEngine';
import { prisma } from '@config/database';
import { logger } from '@config/logger';

function calculateTerminalValue(
  finalYearFcff: number,
  wacc: number,
  terminalGrowth: number
): number {
  if (wacc <= terminalGrowth) {
    throw new Error('WACC must be greater than terminal growth rate');
  }
  return (finalYearFcff * (1 + terminalGrowth)) / (wacc - terminalGrowth);
}

function calculatePV(value: number, wacc: number, year: number): number {
  return value / Math.pow(1 + wacc, year);
}

export async function calculateDcf(
  ticker: string,
  input: DcfInput,
  currentPrice?: number
): Promise<DcfResponse> {
  const { forecastYears, revenueGrowth, ebitMargin, taxRate, wacc: inputWacc, terminalGrowth, sharesOutstanding, netDebt, cash } = input;

  if (revenueGrowth.length !== forecastYears || ebitMargin.length !== forecastYears) {
    throw new Error('Revenue growth and EBIT margin arrays must match forecast years');
  }

  if (inputWacc <= terminalGrowth) {
    throw new Error('WACC must be greater than terminal growth rate');
  }

  const waccResult = await calculateWacc(ticker);
  const wacc = inputWacc || waccResult.wacc;

  const company = await prisma.company.findUnique({
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

  if (!company) {
    throw new Error(`Company ${ticker} not found`);
  }

  const latestPeriod = company.financials[0];
  const income = latestPeriod?.income;
  const balance = latestPeriod?.balance;
  const cashflow = latestPeriod?.cashflow;
  const shares = latestPeriod?.shares;

  const baseRevenue = income?.revenue ? Number(income.revenue) : 0;
  const baseEbitda = income?.operatingIncome ? Number(income.operatingIncome) + (cashflow?.depreciationAmortization ? Number(cashflow.depreciationAmortization) : 0) : 0;
  const baseDepreciation = cashflow?.depreciationAmortization ? Number(cashflow.depreciationAmortization) : 0;
  const baseCapex = cashflow?.capitalExpenditure ? Math.abs(Number(cashflow.capitalExpenditure)) : 0;
  const baseNwc = balance ? (Number(balance.currentAssets || 0) - Number(balance.currentLiabilities || 0)) : 0;

  const sharesOut = sharesOutstanding || shares?.sharesOutstanding ? Number(shares?.sharesOutstanding) : (company.marketSnapshot?.sharesOutstanding ? Number(company.marketSnapshot.sharesOutstanding) : 1);
  const currentPrice_ = currentPrice || (company.marketSnapshot?.price ? Number(company.marketSnapshot.price) : 0);

  const netDebt_ = netDebt !== undefined ? netDebt : (balance?.totalDebt ? Number(balance.totalDebt) : 0) - (balance?.cashAndEquivalents ? Number(balance.cashAndEquivalents) : 0) - (balance?.marketableSecurities ? Number(balance.marketableSecurities) : 0);
  const cash_ = cash !== undefined ? cash : (balance?.cashAndEquivalents ? Number(balance.cashAndEquivalents) : 0) + (balance?.marketableSecurities ? Number(balance.marketableSecurities) : 0);

  const forecast: any[] = [];
  let prevRevenue = baseRevenue;
  let prevNwc = baseNwc;

  for (let i = 0; i < forecastYears; i++) {
    const year = i + 1;
    const revenue = prevRevenue * (1 + revenueGrowth[i]);
    const ebitda = revenue * ebitMargin[i] * 1.2;
    const ebit = revenue * ebitMargin[i];
    const tax = ebit * taxRate;
    const nopat = ebit - tax;
    const depreciationAmortization = baseDepreciation * (revenue / baseRevenue);
    const capex = baseCapex * (revenue / baseRevenue);
    const nwc = baseNwc * (revenue / baseRevenue);
    const changeInNwc = nwc - prevNwc;
    const fcff = nopat + depreciationAmortization - capex - changeInNwc;
    const pvFcff = calculatePV(fcff, wacc, year);

    forecast.push({
      year,
      revenue,
      ebitda,
      ebit,
      tax,
      nopat,
      depreciationAmortization,
      capex,
      changeInNwc,
      fcff,
      pvFcff,
    });

    prevRevenue = revenue;
    prevNwc = nwc;
  }

  const finalYearFcff = forecast[forecast.length - 1].fcff;
  const terminalValue = calculateTerminalValue(finalYearFcff, wacc, terminalGrowth);
  const pvTerminalValue = calculatePV(terminalValue, wacc, forecastYears);

  const pvFcff = forecast.reduce((sum, f) => sum + f.pvFcff, 0);
  const enterpriseValue = pvFcff + pvTerminalValue;
  const equityValue = enterpriseValue - netDebt_ + cash_;
  const fairValuePerShare = equityValue / sharesOut;
  const upside = currentPrice_ > 0 ? (fairValuePerShare - currentPrice_) / currentPrice_ : 0;

  const response: DcfResponse = {
    model: 'DCF',
    enterpriseValue,
    equityValue,
    fairValuePerShare,
    currentPrice: currentPrice_,
    upside,
    wacc,
    terminalGrowth,
    forecast,
    terminalValue,
    pvTerminalValue,
    pvFcff,
    netDebt: netDebt_,
    sharesOutstanding: sharesOut,
  };

  return response;
}