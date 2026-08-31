import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { marketParamsSchema } from '@api/schemas/market';
import { getMarketData, getLatestPrice } from '@services/marketService';
import { createSuccessResponse } from '@api/schemas/response';
import { AppError } from '@utils/errors';

export async function marketRoutes(
  app: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  app.get('/market/:ticker', {
    schema: {
      params: marketParamsSchema,
      tags: ['Market'],
      summary: 'Get market data',
      description: 'Get current market snapshot and price history for a ticker',
    },
  }, async (request, reply) => {
    const { ticker } = request.params as { ticker: string };
    const data = await getMarketData(ticker);
    if (!data) {
      throw AppError.notFound('Market data', ticker);
    }
    return reply.send(createSuccessResponse(data, request.id));
  });

  app.get('/market/:ticker/quote', {
    schema: {
      params: marketParamsSchema,
      tags: ['Market'],
      summary: 'Get latest quote',
      description: 'Get real-time price quote for a ticker',
    },
  }, async (request, reply) => {
    const { ticker } = request.params as { ticker: string };
    const quote = await getLatestPrice(ticker);
    if (!quote) {
      throw AppError.notFound('Quote', ticker);
    }
    return reply.send(createSuccessResponse(quote, request.id));
  });
}