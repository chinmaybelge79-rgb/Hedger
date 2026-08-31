import { prisma } from '@config/database';
import { DdmInput, DdmResponse } from '@api/schemas/ddm';

export async function calculateDdm(ticker: string, input: DdmInput): Promise<DdmResponse> {
  const targetCompany = await prisma.company.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: { marketSnapshot: true },
  });

  if (!targetCompany) {
    throw new Error(`Company ${ticker} not found`);
  }

  const { model, currentDividend, growthRate, terminalGrowth, costOfEquity, highGrowthYears, highGrowthRate, stableGrowthRate } = input;
  const currentPrice = targetCompany.marketSnapshot?.price ? Number(targetCompany.marketSnapshot.price) : 0;

  let fairValuePerShare = 0;

  if (model === 'gordon') {
    if (costOfEquity <= terminalGrowth) {
      throw new Error('Cost of equity must be greater than terminal growth');
    }
    fairValuePerShare = currentDividend * (1 + terminalGrowth) / (costOfEquity - terminalGrowth);
  } else if (model === 'two-stage') {
    const hgRate = highGrowthRate ?? growthRate;
    const sgRate = stableGrowthRate ?? terminalGrowth;

    if (costOfEquity <= sgRate) {
      throw new Error('Cost of equity must be greater than stable growth');
    }

    let pvDividends = 0;
    let dividend = currentDividend;

    for (let year = 1; year <= highGrowthYears; year++) {
      dividend *= (1 + hgRate);
      pvDividends += dividend / Math.pow(1 + costOfEquity, year);
    }

    const terminalDividend = dividend * (1 + sgRate);
    const terminalValue = terminalDividend / (costOfEquity - sgRate);
    const pvTerminal = terminalValue / Math.pow(1 + costOfEquity, highGrowthYears);

    fairValuePerShare = pvDividends + pvTerminal;
  } else if (model === 'three-stage') {
    const hgRate = highGrowthRate ?? growthRate;
    const transitionYears = 5;
    const sgRate = stableGrowthRate ?? terminalGrowth;

    if (costOfEquity <= sgRate) {
      throw new Error('Cost of equity must be greater than stable growth');
    }

    let pvDividends = 0;
    let dividend = currentDividend;

    for (let year = 1; year <= highGrowthYears; year++) {
      dividend *= (1 + hgRate);
      pvDividends += dividend / Math.pow(1 + costOfEquity, year);
    }

    for (let year = 1; year <= transitionYears; year++) {
      const growthRate_ = hgRate - (hgRate - sgRate) * (year / (transitionYears + 1));
      dividend *= (1 + growthRate_);
      pvDividends += dividend / Math.pow(1 + costOfEquity, highGrowthYears + year);
    }

    const terminalDividend = dividend * (1 + sgRate);
    const terminalValue = terminalDividend / (costOfEquity - sgRate);
    const pvTerminal = terminalValue / Math.pow(1 + costOfEquity, highGrowthYears + transitionYears);

    fairValuePerShare = pvDividends + pvTerminal;
  }

  const upside = currentPrice > 0 ? (fairValuePerShare - currentPrice) / currentPrice : 0;

  return {
    model,
    fairValuePerShare,
    currentPrice,
    upside,
    inputs: { currentDividend, growthRate, terminalGrowth, costOfEquity, highGrowthYears, highGrowthRate, stableGrowthRate },
  };
}