import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { valuationParamsSchema, sensitivityInputSchema, scenarioInputSchema, monteCarloInputSchema } from '@api/schemas/analytics';
import { calculateSensitivity } from '@analytics/sensitivity/sensitivityEngine';
import { calculateScenarios } from '@analytics/scenarios/scenariosEngine';
import { calculateMonteCarlo } from '@analytics/monte-carlo/monteCarloEngine';
import { calculateRisk } from '@analytics/risk/riskEngine';
import { calculateConfidence } from '@analytics/confidence/confidenceEngine';
import { getLatestPrice } from '@services/marketService';
import { createSuccessResponse } from '@api/schemas/response';
import { AppError } from '@utils/errors';

export async function analyticsRoutes(
  app: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  app.post('/valuation/:ticker/dcf/sensitivity', {
    schema: {
      params: valuationParamsSchema,
      body: sensitivityInputSchema,
      tags: ['Analytics'],
      summary: 'Run sensitivity analysis',
      description: 'Run 2D sensitivity analysis (WACC vs Terminal Growth) for DCF',
    },
  }, async (request, reply) => {
    const { ticker } = request.params as { ticker: string };
    const input = request.body as any;
    try {
      const result = await calculateSensitivity(ticker, input);
      return reply.send(createSuccessResponse(result, request.id));
    } catch (error) {
      throw AppError.validationError(error instanceof Error ? error.message : 'Sensitivity analysis failed');
    }
  });

  app.post('/valuation/:ticker/scenarios', {
    schema: {
      params: valuationParamsSchema,
      body: scenarioInputSchema,
      tags: ['Analytics'],
      summary: 'Run scenario analysis',
      description: 'Run Bear/Base/Bull scenario analysis',
    },
  }, async (request, reply) => {
    const { ticker } = request.params as { ticker: string };
    const input = request.body as any;
    try {
      const price = await getLatestPrice(ticker);
      const currentPrice = price?.price || 0;
      const result = await calculateScenarios(ticker, input, currentPrice);
      return reply.send(createSuccessResponse(result, request.id));
    } catch (error) {
      throw AppError.validationError(error instanceof Error ? error.message : 'Scenario analysis failed');
    }
  });

  app.post('/valuation/:ticker/monte-carlo', {
    schema: {
      params: valuationParamsSchema,
      body: monteCarloInputSchema,
      tags: ['Analytics'],
      summary: 'Run Monte Carlo simulation',
      description: 'Run Monte Carlo simulation for DCF valuation',
    },
  }, async (request, reply) => {
    const { ticker } = request.params as { ticker: string };
    const input = request.body as any;
    try {
      const result = await calculateMonteCarlo(ticker, input);
      return reply.send(createSuccessResponse(result, request.id));
    } catch (error) {
      throw AppError.validationError(error instanceof Error ? error.message : 'Monte Carlo simulation failed');
    }
  });

  app.get('/valuation/:ticker/risk', {
    schema: {
      params: valuationParamsSchema,
      tags: ['Analytics'],
      summary: 'Get risk analysis',
      description: 'Get comprehensive risk analysis with factor breakdown',
    },
  }, async (request, reply) => {
    const { ticker } = request.params as { ticker: string };
    const result = await calculateRisk(ticker);
    return reply.send(createSuccessResponse(result, request.id));
  });

  app.get('/valuation/:ticker/confidence', {
    schema: {
      params: valuationParamsSchema,
      tags: ['Analytics'],
      summary: 'Get confidence score',
      description: 'Get valuation confidence score with component breakdown',
    },
  }, async (request, reply) => {
    const { ticker } = request.params as { ticker: string };
    const result = await calculateConfidence(ticker);
    return reply.send(createSuccessResponse(result, request.id));
  });
}