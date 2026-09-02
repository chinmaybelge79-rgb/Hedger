import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '@api/middleware/auth';
import { saveValuationRun, listValuationRuns, getValuationRun, deleteValuationRun } from '@services/valuationRunService';
import { createSuccessResponse } from '@api/schemas/response';
import { AppError } from '@utils/errors';

const saveRunSchema = z.object({
  ticker: z.string().min(1).max(10),
  model: z.string().min(1).max(40),
  inputs: z.any(),
  result: z.any(),
  confidence: z.number().nullable().optional(),
  riskScore: z.number().int().nullable().optional(),
  durationMs: z.number().int().nullable().optional(),
  status: z.string().max(20).optional(),
  errorMessage: z.string().nullable().optional(),
});

const listRunsQuery = z.object({
  ticker: z.string().max(10).optional(),
  model: z.string().max(40).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function runsRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  app.post('/runs', {
    schema: { body: saveRunSchema, tags: ['Runs'], summary: 'Save a valuation run' },
  }, async (request, reply) => {
    const user = await requireAuth(request);
    const body = request.body as z.infer<typeof saveRunSchema>;
    try {
      const run = await saveValuationRun(user.id, body);
      return reply.status(201).send(createSuccessResponse({ run }, request.id));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to save valuation run');
    }
  });

  app.get('/runs', {
    schema: { querystring: listRunsQuery, tags: ['Runs'], summary: 'List saved valuation runs' },
  }, async (request, reply) => {
    const user = await requireAuth(request);
    const q = request.query as z.infer<typeof listRunsQuery>;
    const runs = await listValuationRuns(user.id, q);
    return reply.send(createSuccessResponse({ runs }, request.id));
  });

  app.get('/runs/:runId', {
    schema: { tags: ['Runs'], summary: 'Get a saved valuation run' },
  }, async (request, reply) => {
    const user = await requireAuth(request);
    const { runId } = request.params as { runId: string };
    const run = await getValuationRun(user.id, runId);
    return reply.send(createSuccessResponse({ run }, request.id));
  });

  app.delete('/runs/:runId', {
    schema: { tags: ['Runs'], summary: 'Delete a saved valuation run' },
  }, async (request, reply) => {
    const user = await requireAuth(request);
    const { runId } = request.params as { runId: string };
    const run = await deleteValuationRun(user.id, runId);
    return reply.send(createSuccessResponse({ deleted: run.id }, request.id));
  });
}
