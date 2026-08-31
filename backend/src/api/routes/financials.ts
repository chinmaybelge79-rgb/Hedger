import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { financialsParamsSchema, financialsQuerySchema, FinancialsQuery } from '@api/schemas/financials';
import { getFinancials } from '@services/financialsService';
import { createSuccessResponse } from '@api/schemas/response';
import { AppError } from '@utils/errors';

export async function financialsRoutes(
  app: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  app.get('/financials/:ticker', {
    schema: {
      params: financialsParamsSchema,
      querystring: financialsQuerySchema,
      tags: ['Financials'],
      summary: 'Get financial statements',
      description: 'Get income statement, balance sheet, cash flow, and derived metrics',
    },
  }, async (request, reply) => {
    const { ticker } = request.params as { ticker: string };
    const query = request.query as FinancialsQuery;
    const data = await getFinancials(ticker, query);
    if (!data) {
      throw AppError.notFound('Financials', ticker);
    }
    return reply.send(createSuccessResponse(data, request.id));
  });
}