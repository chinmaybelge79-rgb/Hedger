import { prisma } from '@config/database';
import { EvaInput, EvaResponse } from '@api/schemas/eva';

export async function calculateEva(ticker: string, input: EvaInput): Promise<EvaResponse> {
  const targetCompany = await prisma.company.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: { marketSnapshot: true },
  });

  if (!targetCompany) {
    throw new Error(`Company ${ticker} not found`);
  }

  const { wacc, forecastYears, nopat, investedCapital, terminalGrowth, currentInvestedCapital, sharesOutstanding } = input;
  const currentPrice = targetCompany.marketSnapshot?.price ? Number(targetCompany.marketSnapshot.price) : 0;

  let pvEva = 0;
  const forecast: any[] = [];

  for (let i = 0; i < forecastYears; i++) {
    const year = i + 1;
    const yearNopat = nopat[i] || nopat[nopat.length - 1];
    const yearIC = investedCapital[i] || investedCapital[investedCapital.length - 1];
    const capitalCharge = yearIC * wacc;
    const eva = yearNopat - capitalCharge;
    const pvEvaYear = eva / Math.pow(1 + wacc, year);
    pvEva += pvEvaYear;

    forecast.push({
      year,
      nopat: yearNopat,
      investedCapital: yearIC,
      capitalCharge,
      eva,
      pvEva: pvEvaYear,
    });
  }

  const terminalEVA = forecast[forecast.length - 1].eva * (1 + terminalGrowth);
  const terminalValue = terminalEVA / (wacc - terminalGrowth);
  const pvTerminal = terminalValue / Math.pow(1 + wacc, forecastYears);

  pvEva += pvTerminal;
  const equityValue = currentInvestedCapital + pvEva;
  const fairValuePerShare = equityValue / sharesOutstanding;
  const upside = currentPrice > 0 ? (fairValuePerShare - currentPrice) / currentPrice : 0;

  return {
    model: 'EVA',
    currentEVA: forecast[0]?.eva || 0,
    presentValueEVA: pvEva,
    fairValuePerShare,
    currentPrice,
    upside,
    investedCapital: currentInvestedCapital,
    forecast,
  };
}