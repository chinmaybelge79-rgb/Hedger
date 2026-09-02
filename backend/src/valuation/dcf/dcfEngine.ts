import { AppError } from '@utils/errors';
import { DcfInput, DcfResponse } from '@api/schemas/valuation';
import { calculateWacc } from '../wacc/waccEngine';
import { prisma } from '@config/database';

export interface DcfCompanyBase {
  baseRevenue: number;
  baseDepreciation: number;
  baseCapex: number;
  baseNwc: number;
  netDebt: number;
  sharesOutstanding: number;
  currentPrice: number;
}

/**
 * Pure DCF math — no I/O, so callers can run it thousands of times
 * (reverse DCF, Monte Carlo, sensitivity) without touching the database.
 */
export function runDcfMath(
  base: DcfCompanyBase,
  params: {
    forecastYears: number;
    revenueGrowth: number[];
    ebitMargin: number[];
    taxRate: number;
    wacc: number;
    terminalGrowth: number;
  }
): DcfResponse {
  const { forecastYears, revenueGrowth, ebitMargin, taxRate, wacc, terminalGrowth } = params;

  if (revenueGrowth.length !== forecastYears || ebitMargin.length !== forecastYears) {
    throw new Error('Revenue growth and EBIT margin arrays must match forecast years');
  }
  if (wacc <= terminalGrowth) {
    throw new Error('WACC must be greater than terminal growth rate');
  }
  if (base.sharesOutstanding <= 0) {
    throw new Error('Shares outstanding must be positive');
  }

  // Scale factors derived from revenue; guard against zero base revenue
  const revRatio = (revenue: number) => base.baseRevenue > 0 ? revenue / base.baseRevenue : 1;

  const forecast: DcfResponse['forecast'] = [];
  let prevRevenue = base.baseRevenue;
  let prevNwc = base.baseNwc;

  for (let i = 0; i < forecastYears; i++) {
    const year = i + 1;
    const revenue = prevRevenue * (1 + revenueGrowth[i]);
    const margin = ebitMargin[i];
    const ebit = revenue * margin;
    const ebitda = ebit + base.baseDepreciation * revRatio(revenue);
    const tax = ebit * taxRate;
    const nopat = ebit - tax;
    const depreciationAmortization = base.baseDepreciation * revRatio(revenue);
    const capex = base.baseCapex * revRatio(revenue);
    const nwc = base.baseNwc * revRatio(revenue);
    const changeInNwc = nwc - prevNwc;
    const fcff = nopat + depreciationAmortization - capex - changeInNwc;

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
      pvFcff: fcff / Math.pow(1 + wacc, year),
    });

    prevRevenue = revenue;
    prevNwc = nwc;
  }

  const finalYearFcff = forecast[forecast.length - 1].fcff;
  const terminalValue = (finalYearFcff * (1 + terminalGrowth)) / (wacc - terminalGrowth);
  const pvTerminalValue = terminalValue / Math.pow(1 + wacc, forecastYears);
  const pvFcff = forecast.reduce((sum, f) => sum + f.pvFcff, 0);
  const enterpriseValue = pvFcff + pvTerminalValue;
  // netDebt already subtracts cash; equity value is EV - netDebt
  const equityValue = enterpriseValue - base.netDebt;
  const fairValuePerShare = equityValue / base.sharesOutstanding;
  const upside = base.currentPrice > 0 ? (fairValuePerShare - base.currentPrice) / base.currentPrice : 0;

  return {
    model: 'DCF',
    enterpriseValue,
    equityValue,
    fairValuePerShare,
    currentPrice: base.currentPrice,
    upside,
    wacc,
    terminalGrowth,
    forecast,
    terminalValue,
    pvTerminalValue,
    pvFcff,
    netDebt: base.netDebt,
    sharesOutstanding: base.sharesOutstanding,
  };
}

/** Loads company fundamentals once; reused by all DCF-derived analytics. */
export async function loadDcfBase(
  ticker: string,
  overrides: { sharesOutstanding?: number; netDebt?: number; cash?: number; currentPrice?: number } = {}
): Promise<DcfCompanyBase> {
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

  if (!company) throw AppError.notFound('Company', ticker);

  const latest = company.financials[0];
  const income = latest?.income;
  const balance = latest?.balance;
  const cashflow = latest?.cashflow;
  const shares = latest?.shares;

  const snapshotShares = company.marketSnapshot?.sharesOutstanding
    ? Number(company.marketSnapshot.sharesOutstanding)
    : null;

  // Explicit precedence: user input > per-period shares > snapshot > 1
  const sharesOut = overrides.sharesOutstanding
    ?? (shares?.sharesOutstanding ? Number(shares.sharesOutstanding) : null)
    ?? snapshotShares
    ?? 1;

  const currentPrice = overrides.currentPrice
    ?? (company.marketSnapshot?.price ? Number(company.marketSnapshot.price) : 0);

  const totalDebt = balance?.totalDebt ? Number(balance.totalDebt) : 0;
  const cash = balance?.cashAndEquivalents ? Number(balance.cashAndEquivalents) : 0;
  const securities = balance?.marketableSecurities ? Number(balance.marketableSecurities) : 0;

  const netDebt = overrides.netDebt !== undefined
    ? overrides.netDebt
    : totalDebt - cash - securities;

  return {
    baseRevenue: income?.revenue ? Number(income.revenue) : 0,
    baseDepreciation: cashflow?.depreciationAmortization ? Number(cashflow.depreciationAmortization) : 0,
    baseCapex: cashflow?.capitalExpenditure ? Math.abs(Number(cashflow.capitalExpenditure)) : 0,
    baseNwc: balance ? Number(balance.currentAssets || 0) - Number(balance.currentLiabilities || 0) : 0,
    netDebt,
    sharesOutstanding: sharesOut,
    currentPrice,
  };
}

export async function calculateDcf(
  ticker: string,
  input: DcfInput,
  currentPrice?: number
): Promise<DcfResponse> {
  const { forecastYears, revenueGrowth, ebitMargin, taxRate, wacc: inputWacc, terminalGrowth } = input;

  // Only fetch company WACC when the caller didn't supply one
  const wacc = inputWacc || (await calculateWacc(ticker)).wacc;

  const base = await loadDcfBase(ticker, {
    sharesOutstanding: input.sharesOutstanding,
    netDebt: input.netDebt,
    cash: input.cash,
    currentPrice,
  });

  return runDcfMath(base, { forecastYears, revenueGrowth, ebitMargin, taxRate, wacc, terminalGrowth });
}
