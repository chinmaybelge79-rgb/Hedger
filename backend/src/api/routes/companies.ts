import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { companyParamsSchema } from '@api/schemas/company';
import { getCompanyProfile, getCompanyPriceHistory } from '@services/companyService';
import { createSuccessResponse } from '@api/schemas/response';
import { AppError } from '@utils/errors';

export async function companyRoutes(
  app: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  app.get('/companies/:ticker', {
    schema: {
      params: companyParamsSchema,
      tags: ['Companies'],
      summary: 'Get company profile',
      description: 'Get comprehensive company information including identity, market data, fundamentals, and financial quality',
    },
  }, async (request, reply) => {
    const { ticker } = request.params as { ticker: string };
    const profile = await getCompanyProfile(ticker);
    if (!profile) {
      throw AppError.notFound('Company', ticker);
    }
    return reply.send(createSuccessResponse(profile, request.id));
  });

  app.get('/companies/:ticker/price-history', {
    schema: {
      params: companyParamsSchema,
      querystring: { type: 'object', properties: { years: { type: 'integer', minimum: 1, maximum: 20, default: 7 } } },
      tags: ['Companies'],
      summary: 'Get price history',
      description: 'Get historical price data for charting',
    },
  }, async (request, reply) => {
    const { ticker } = request.params as { ticker: string };
    const { years = 7 } = request.query as { years?: number };
    const data = await getCompanyPriceHistory(ticker, years);
    return reply.send(createSuccessResponse({ data }, request.id));
  });
}