import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { searchQuerySchema, SearchQuery } from '@api/schemas/search';
import { searchCompanies, getCompanyByTicker } from '@services/searchService';
import { createSuccessResponse } from '@api/schemas/response';
import { AppError } from '@utils/errors';

export async function searchRoutes(
  app: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  app.get('/search', {
    schema: {
      querystring: searchQuerySchema,
      tags: ['Search'],
      summary: 'Search companies',
      description: 'Search for companies by ticker symbol or name',
    },
  }, async (request, reply) => {
    const query = request.query as SearchQuery;
    const results = await searchCompanies(query);
    return reply.send(createSuccessResponse({ results }, request.id));
  });

  app.get('/search/:ticker', {
    schema: {
      params: { type: 'object', properties: { ticker: { type: 'string' } }, required: ['ticker'] },
      tags: ['Search'],
      summary: 'Get company by ticker',
      description: 'Get detailed company information by ticker symbol',
    },
  }, async (request, reply) => {
    const { ticker } = request.params as { ticker: string };
    const result = await getCompanyByTicker(ticker);
    if (!result) {
      throw AppError.notFound('Company', ticker);
    }
    return reply.send(createSuccessResponse({ results: [result] }, request.id));
  });
}