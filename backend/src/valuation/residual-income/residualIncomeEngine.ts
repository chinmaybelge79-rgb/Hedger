import { prisma } from '@config/database';
import { ResidualIncomeInput, ResidualIncomeResponse } from '@api/schemas/residualIncome';

export async function calculateResidualIncome(ticker: string, input: ResidualIncomeInput): Promise<ResidualIncomeResponse> {
  const targetCompany = await prisma.company.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: {
      marketSnapshot: true,
      financials: {
        orderBy: { periodEnd: 'desc' },
        take: 1,
        include: { balance: true, shares: true },
      },
    },
  });

  if (!targetCompany) {
    throw new Error(`Company ${ticker} not found`);
  }

  const { bookValuePerShare, costOfEquity, forecastYears, roe, payoutRatio, terminalGrowth } = input;
  const currentPrice = targetCompany.marketSnapshot?.price ? Number(targetCompany.marketSnapshot.price) : 0;

  const latest = targetCompany.financials[0];
  const balance = latest?.balance;
  const shares = latest?.shares;
  const equity = balance?.shareholdersEquity ? Number(balance.shareholdersEquity) : 0;
  const sharesOut = input.sharesOutstanding || shares?.sharesOutstanding ? Number(shares?.sharesOutstanding) : 1;
  const bvps = bookValuePerShare || (equity > 0 && sharesOut > 0 ? equity / sharesOut : 0);

  let beginningBV = bvps;
  let pvRi = 0;
  const forecast: any[] = [];

  for (let i = 0; i < forecastYears; i++) {
    const year = i + 1;
    const yearRoe = roe[i] || roe[roe.length - 1];
    const netIncome = beginningBV * yearRoe;
    const ri = netIncome - beginningBV * costOfEquity;
    const pvRiYear = ri / Math.pow(1 + costOfEquity, year);
    pvRi += pvRiYear;

    const endingBV = beginningBV + netIncome * (1 - payoutRatio);

    forecast.push({
      year,
      beginningBV,
      netIncome,
      residualIncome: ri,
      pvRi: pvRiYear,
      endingBV,
    });

    beginningBV = endingBV;
  }

  const terminalRI = forecast[forecast.length - 1].residualIncome * (1 + terminalGrowth);
  const terminalValue = terminalRI / (costOfEquity - terminalGrowth);
  const pvTerminal = terminalValue / Math.pow(1 + costOfEquity, forecastYears);

  pvRi += pvTerminal;
  const fairValuePerShare = bvps + pvRi;
  const upside = currentPrice > 0 ? (fairValuePerShare - currentPrice) / currentPrice : 0;

  return {
    model: 'Residual Income',
    bookValuePerShare: bvps,
    presentValueRi: pvRi,
    fairValuePerShare,
    currentPrice,
    upside,
    forecast,
  };
}