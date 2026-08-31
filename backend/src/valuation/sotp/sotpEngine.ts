import { prisma } from '@config/database';
import { SotpInput, SotpResponse } from '@api/schemas/sotp';

export async function calculateSotp(ticker: string, input: SotpInput): Promise<SotpResponse> {
  const targetCompany = await prisma.company.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: { marketSnapshot: true },
  });

  if (!targetCompany) {
    throw new Error(`Company ${ticker} not found`);
  }

  const segments = input.segments.map(s => ({
    name: s.name,
    revenue: s.revenue,
    ebitda: s.ebitda,
    multiple: s.multiple,
    ev: s.ebitda * s.multiple,
  }));

  const totalEV = segments.reduce((sum, s) => sum + s.ev, 0);
  const equityValue = totalEV - input.netDebt + input.investments;
  const fairValuePerShare = equityValue / input.sharesOutstanding;
  const currentPrice = targetCompany.marketSnapshot?.price ? Number(targetCompany.marketSnapshot.price) : 0;
  const upside = currentPrice > 0 ? (fairValuePerShare - currentPrice) / currentPrice : 0;

  return {
    segments,
    totalEV,
    netDebt: input.netDebt,
    investments: input.investments,
    equityValue,
    fairValuePerShare,
    currentPrice,
    upside,
  };
}