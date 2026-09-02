import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { valuationParamsSchema } from '@api/schemas/valuation';
import { compsInputSchema } from '@api/schemas/comps';
import { sotpInputSchema } from '@api/schemas/sotp';
import { ddmInputSchema } from '@api/schemas/ddm';
import { residualIncomeInputSchema } from '@api/schemas/residualIncome';
import { evaInputSchema } from '@api/schemas/eva';
import { calculateComps } from '@valuation/comps/compsEngine';
import { calculateSotp } from '@valuation/sotp/sotpEngine';
import { calculateDdm } from '@valuation/ddm/ddmEngine';
import { calculateResidualIncome } from '@valuation/residual-income/residualIncomeEngine';
import { calculateEva } from '@valuation/eva/evaEngine';
import { createSuccessResponse } from '@api/schemas/response';
import { AppError } from '@utils/errors';

export async function modelRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  app.post('/valuation/:ticker/comps', {
    schema: {
      params: valuationParamsSchema,
      body: compsInputSchema,
      tags: ['Valuation'],
      summary: 'Run comparable companies analysis',
      description: 'Run comparable companies valuation using sector peer median multiples',
    },
  }, async (request, reply) => {
    const { ticker } = request.params as { ticker: string };
    const input = request.body as any;
    try {
      const result = await calculateComps(ticker, input ?? {});
      return reply.send(createSuccessResponse(result, request.id));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.validationError(error instanceof Error ? error.message : 'Comps analysis failed');
    }
  });

  app.post('/valuation/:ticker/sotp', {
    schema: {
      params: valuationParamsSchema,
      body: sotpInputSchema,
      tags: ['Valuation'],
      summary: 'Run sum-of-the-parts valuation',
      description: 'Run SOTP valuation across user-defined business segments',
    },
  }, async (request, reply) => {
    const { ticker } = request.params as { ticker: string };
    const input = request.body as any;
    try {
      const result = await calculateSotp(ticker, input);
      return reply.send(createSuccessResponse(result, request.id));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.validationError(error instanceof Error ? error.message : 'SOTP valuation failed');
    }
  });

  app.post('/valuation/:ticker/ddm', {
    schema: {
      params: valuationParamsSchema,
      body: ddmInputSchema,
      tags: ['Valuation'],
      summary: 'Run dividend discount model',
      description: 'Run DDM valuation (Gordon growth, two-stage, or three-stage)',
    },
  }, async (request, reply) => {
    const { ticker } = request.params as { ticker: string };
    const input = request.body as any;
    try {
      const result = await calculateDdm(ticker, input);
      return reply.send(createSuccessResponse(result, request.id));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.validationError(error instanceof Error ? error.message : 'DDM valuation failed');
    }
  });

  app.post('/valuation/:ticker/residual-income', {
    schema: {
      params: valuationParamsSchema,
      body: residualIncomeInputSchema,
      tags: ['Valuation'],
      summary: 'Run residual income valuation',
      description: 'Run residual income model from book value and forecasted ROE',
    },
  }, async (request, reply) => {
    const { ticker } = request.params as { ticker: string };
    const input = request.body as any;
    try {
      const result = await calculateResidualIncome(ticker, input);
      return reply.send(createSuccessResponse(result, request.id));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.validationError(error instanceof Error ? error.message : 'Residual income valuation failed');
    }
  });

  app.post('/valuation/:ticker/eva', {
    schema: {
      params: valuationParamsSchema,
      body: evaInputSchema,
      tags: ['Valuation'],
      summary: 'Run economic value added valuation',
      description: 'Run EVA valuation from NOPAT and invested capital forecasts',
    },
  }, async (request, reply) => {
    const { ticker } = request.params as { ticker: string };
    const input = request.body as any;
    try {
      const result = await calculateEva(ticker, input);
      return reply.send(createSuccessResponse(result, request.id));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.validationError(error instanceof Error ? error.message : 'EVA valuation failed');
    }
  });
}
