import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { valuationParamsSchema, dcfInputSchema, reverseDcfInputSchema } from '@api/schemas/valuation';
import { calculateWacc } from '@valuation/wacc/waccEngine';
import { calculateDcf } from '@valuation/dcf/dcfEngine';
import { calculateReverseDcf } from '@valuation/reverse-dcf/reverseDcfEngine';
import { createSuccessResponse } from '@api/schemas/response';
import { AppError } from '@utils/errors';

export async function valuationRoutes(
  app: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  app.get('/valuation/:ticker/wacc', {
    schema: {
      params: valuationParamsSchema,
      tags: ['Valuation'],
      summary: 'Get WACC calculation',
      description: 'Get detailed WACC calculation with all components',
    },
  }, async (request, reply) => {
    const { ticker } = request.params as { ticker: string };
    const wacc = await calculateWacc(ticker);
    return reply.send(createSuccessResponse(wacc, request.id));
  });

  app.post('/valuation/:ticker/dcf', {
    schema: {
      params: valuationParamsSchema,
      body: dcfInputSchema,
      tags: ['Valuation'],
      summary: 'Run DCF valuation',
      description: 'Run a DCF valuation with custom assumptions',
    },
  }, async (request, reply) => {
    const { ticker } = request.params as { ticker: string };
    const input = request.body as any;
    try {
      const result = await calculateDcf(ticker, input);
      return reply.send(createSuccessResponse(result, request.id));
    } catch (error) {
      throw AppError.validationError(error instanceof Error ? error.message : 'DCF calculation failed');
    }
  });

  app.post('/valuation/:ticker/reverse-dcf', {
    schema: {
      params: valuationParamsSchema,
      body: reverseDcfInputSchema,
      tags: ['Valuation'],
      summary: 'Run Reverse DCF',
      description: 'Calculate implied assumptions from current stock price',
    },
  }, async (request, reply) => {
    const { ticker } = request.params as { ticker: string };
    const input = request.body as any;
    try {
      const result = await calculateReverseDcf(ticker, input);
      return reply.send(createSuccessResponse(result, request.id));
    } catch (error) {
      throw AppError.validationError(error instanceof Error ? error.message : 'Reverse DCF calculation failed');
    }
  });
}