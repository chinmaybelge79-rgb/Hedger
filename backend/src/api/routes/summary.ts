import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { valuationParamsSchema } from '@api/schemas/valuation';
import { calculateWacc } from '@valuation/wacc/waccEngine';
import { calculateDcf } from '@valuation/dcf/dcfEngine';
import { calculateReverseDcf } from '@valuation/reverse-dcf/reverseDcfEngine';
import { calculateComps } from '@valuation/comps/compsEngine';
import { getLatestPrice } from '@services/marketService';
import { createSuccessResponse } from '@api/schemas/response';
import { AppError } from '@utils/errors';

export async function summaryRoutes(
  app: FastifyInstance,
  options: FastifyPluginOptions
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

      const waccResult = await calculateWacc(ticker);

      const [dcfResult, reverseDcfResult, compsResult] = await Promise.all([
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
      ]);

      const models = {
        dcf: dcfResult.fairValuePerShare,
        reverseDcf: reverseDcfResult,
        comps: compsResult.fairValuePerShare,
        sotp: 0,
        ddm: 0,
        residualIncome: 0,
        eva: 0,
      };

      const validModels = Object.entries(models)
        .filter(([_, v]) => typeof v === 'number' && v > 0)
        .map(([_, v]) => v as number);

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
      throw AppError.internal('Failed to generate valuation summary');
    }
  });
}