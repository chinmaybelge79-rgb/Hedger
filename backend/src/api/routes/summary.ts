import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { valuationParamsSchema } from '@api/schemas/valuation';
import { calculateWacc } from '@valuation/wacc/waccEngine';
import { calculateDcf } from '@valuation/dcf/dcfEngine';
import { calculateReverseDcf } from '@valuation/reverse-dcf/reverseDcfEngine';
import { calculateComps } from '@valuation/comps/compsEngine';
import { calculateDdm } from '@valuation/ddm/ddmEngine';
import { calculateResidualIncome } from '@valuation/residual-income/residualIncomeEngine';
import { calculateEva } from '@valuation/eva/evaEngine';
import { getLatestPrice } from '@services/marketService';
import { createSuccessResponse } from '@api/schemas/response';
import { AppError } from '@utils/errors';
import { prisma } from '@config/database';
import { logger } from '@config/logger';

function positiveOrNull(value: number | null | undefined): number | null {
  return typeof value === 'number' && isFinite(value) && value > 0 ? value : null;
}

export async function summaryRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  app.get('/valuation/:ticker/summary', {
    schema: {
      params: valuationParamsSchema,
      tags: ['Valuation'],
      summary: 'Get valuation summary',
      description: 'Get aggregated valuation across all models',
    },
  }, async (request, reply) => {
    const { ticker } = request.params as { ticker: string };

    try {
      const price = await getLatestPrice(ticker);
      const currentPrice = price?.price || 0;

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
        throw AppError.notFound('Company', ticker);
      }

      const waccResult = await calculateWacc(ticker);

      // ---- Data-driven inputs for secondary models ----
      const latest = company.financials[0];
      const income = latest?.income;
      const balance = latest?.balance;
      const cashflow = latest?.cashflow;
      const shares = latest?.shares;

      const sharesOutstanding =
        positiveOrNull(company.marketSnapshot?.sharesOutstanding ? Number(company.marketSnapshot.sharesOutstanding) : null) ??
        positiveOrNull(shares?.sharesOutstanding ? Number(shares.sharesOutstanding) : null);

      const equity = balance?.shareholdersEquity ? Number(balance.shareholdersEquity) : 0;
      const bookValuePerShare = sharesOutstanding && equity > 0 ? equity / sharesOutstanding : null;

      const netIncome = income?.netIncome ? Number(income.netIncome) : null;
      const operatingIncome = income?.operatingIncome ? Number(income.operatingIncome) : null;

      const totalDebt = balance?.totalDebt ? Number(balance.totalDebt) : 0;
      const cash = balance?.cashAndEquivalents ? Number(balance.cashAndEquivalents) : 0;
      const securities = balance?.marketableSecurities ? Number(balance.marketableSecurities) : 0;

      const dividendsPaid = cashflow?.dividendsPaid ? Number(cashflow.dividendsPaid) : null;
      const currentDividend = dividendsPaid && sharesOutstanding
        ? Math.max(dividendsPaid / sharesOutstanding, 0.01)
        : null;

      const costOfEquity = Math.max(waccResult.costOfEquity, 0.09);

      const roe = netIncome && equity > 0 ? netIncome / equity : 0.18;
      const nopatBase = operatingIncome ? operatingIncome * (1 - 0.21) : null;
      const investedCapitalBase = equity + totalDebt;

      // ---- Run all models in parallel; failures degrade to 0 ----
      const [dcfSettled, reverseDcfSettled, compsSettled, ddmSettled, riSettled, evaSettled] = await Promise.allSettled([
        calculateDcf(ticker, {
          forecastYears: 5,
          revenueGrowth: [0.08, 0.07, 0.06, 0.05, 0.04],
          ebitMargin: [0.31, 0.32, 0.32, 0.33, 0.33],
          taxRate: 0.21,
          wacc: waccResult.wacc,
          terminalGrowth: 0.025,
        }, currentPrice),
        calculateReverseDcf(ticker, { currentPrice, wacc: waccResult.wacc, terminalGrowth: 0.025 }),
        calculateComps(ticker, { metrics: ['EV_REVENUE', 'EV_EBITDA', 'PE'] }),
        currentDividend && sharesOutstanding
          ? calculateDdm(ticker, {
              model: 'two-stage',
              currentDividend,
              growthRate: 0.06,
              terminalGrowth: 0.025,
              costOfEquity,
              highGrowthYears: 5,
              sharesOutstanding,
            })
          : Promise.reject(new Error('Dividend data unavailable')),
        bookValuePerShare
          ? calculateResidualIncome(ticker, {
              bookValuePerShare,
              costOfEquity,
              forecastYears: 5,
              roe: Array.from({ length: 5 }, () => roe),
              payoutRatio: 0.3,
              terminalGrowth: 0.025,
              sharesOutstanding: sharesOutstanding ?? 1,
            })
          : Promise.reject(new Error('Book value data unavailable')),
        nopatBase && investedCapitalBase > 0 && sharesOutstanding
          ? calculateEva(ticker, {
              wacc: waccResult.wacc,
              forecastYears: 5,
              nopat: Array.from({ length: 5 }, (_, i) => nopatBase * Math.pow(1.05, i + 1)),
              investedCapital: Array.from({ length: 5 }, (_, i) => investedCapitalBase * Math.pow(1.04, i + 1)),
              terminalGrowth: 0.025,
              currentInvestedCapital: investedCapitalBase,
              sharesOutstanding,
            })
          : Promise.reject(new Error('Capital data unavailable')),
      ]);

      for (const [name, result] of Object.entries({ ddmSettled, riSettled, evaSettled })) {
        if (result.status === 'rejected') {
          logger.debug({ ticker, model: name, reason: String(result.reason) }, 'Summary model unavailable');
        }
      }

      const dcfResult = dcfSettled.status === 'fulfilled' ? dcfSettled.value : null;
      const reverseDcfResult = reverseDcfSettled.status === 'fulfilled' ? reverseDcfSettled.value : null;
      const compsResult = compsSettled.status === 'fulfilled' ? compsSettled.value : null;
      const ddmResult = ddmSettled.status === 'fulfilled' ? ddmSettled.value : null;
      const riResult = riSettled.status === 'fulfilled' ? riSettled.value : null;
      const evaResult = evaSettled.status === 'fulfilled' ? evaSettled.value : null;

      const models = {
        dcf: dcfResult?.fairValuePerShare ?? 0,
        reverseDcf: reverseDcfResult ?? {
          impliedRevenueGrowth: 0,
          impliedTerminalMargin: 0,
          impliedFcfGrowth: 0,
          interpretation: 'Unavailable',
        },
        comps: compsResult?.fairValuePerShare ?? 0,
        sotp: 0, // SOTP requires user-defined segments; not auto-computed
        ddm: ddmResult?.fairValuePerShare ?? 0,
        residualIncome: riResult?.fairValuePerShare ?? 0,
        eva: evaResult?.fairValuePerShare ?? 0,
      };

      const validModels = [models.dcf, models.comps, models.ddm, models.residualIncome, models.eva]
        .filter((v) => typeof v === 'number' && v > 0);

      const consensusFairValue = validModels.length > 0
        ? validModels.reduce((a, b) => a + b, 0) / validModels.length
        : 0;

      const consensusUpside = currentPrice > 0 ? (consensusFairValue - currentPrice) / currentPrice : 0;

      return reply.send(createSuccessResponse({
        ticker: ticker.toUpperCase(),
        marketPrice: currentPrice,
        models,
        consensus: {
          fairValue: consensusFairValue,
          upside: consensusUpside,
        },
      }, request.id));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to generate valuation summary');
    }
  });
}
