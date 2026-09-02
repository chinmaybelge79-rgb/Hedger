import { prisma } from '@config/database';
import { AppError } from '@utils/errors';

export interface SaveRunInput {
  ticker: string;
  model: string;
  inputs: unknown;
  result: unknown;
  confidence?: number | null;
  riskScore?: number | null;
  durationMs?: number | null;
  status?: string;
  errorMessage?: string | null;
}

const VALID_MODELS = ['DCF', 'REVERSE_DCF', 'COMPS', 'SOTP', 'DDM', 'RESIDUAL_INCOME', 'EVA', 'SENSITIVITY', 'SCENARIOS', 'MONTE_CARLO', 'SUMMARY'];

export async function saveValuationRun(userId: string, input: SaveRunInput) {
  const company = await prisma.company.findUnique({ where: { ticker: input.ticker.toUpperCase() } });
  if (!company) throw AppError.notFound('Company', input.ticker);

  if (!VALID_MODELS.includes(input.model)) {
    throw AppError.validationError(`Invalid model "${input.model}". Valid: ${VALID_MODELS.join(', ')}`);
  }

  return prisma.valuationRun.create({
    data: {
      userId,
      companyId: company.id,
      model: input.model,
      status: input.status ?? 'COMPLETED',
      inputs: input.inputs as object,
      result: input.result as object,
      confidence: input.confidence ?? null,
      riskScore: input.riskScore ?? null,
      durationMs: input.durationMs ?? null,
      errorMessage: input.errorMessage ?? null,
    },
  });
}

export async function listValuationRuns(userId: string, opts: { ticker?: string; model?: string; limit?: number } = {}) {
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
  const company = opts.ticker
    ? await prisma.company.findUnique({ where: { ticker: opts.ticker.toUpperCase() } })
    : null;
  if (opts.ticker && !company) throw AppError.notFound('Company', opts.ticker);

  return prisma.valuationRun.findMany({
    where: {
      userId,
      ...(company ? { companyId: company.id } : {}),
      ...(opts.model ? { model: opts.model } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { company: { select: { ticker: true, name: true } } },
  });
}

export async function getValuationRun(userId: string, runId: string) {
  const run = await prisma.valuationRun.findUnique({
    where: { id: runId },
    include: { company: { select: { ticker: true, name: true } } },
  });
  if (!run || run.userId !== userId) throw AppError.notFound('Valuation run', runId);
  return run;
}

export async function deleteValuationRun(userId: string, runId: string) {
  const run = await getValuationRun(userId, runId);
  await prisma.valuationRun.delete({ where: { id: run.id } });
  return run;
}
