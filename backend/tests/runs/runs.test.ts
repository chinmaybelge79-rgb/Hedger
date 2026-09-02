import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma, connectDatabase, disconnectDatabase } from '../../src/config/database';
import { saveValuationRun, listValuationRuns, getValuationRun, deleteValuationRun } from '../../src/services/valuationRunService';
import { hashPassword } from '../../src/utils/auth';
import { AppError } from '../../src/utils/errors';

describe('valuationRunService', () => {
  let userId: string;
  let companyId: string;
  let runId: string;

  beforeAll(async () => {
    await connectDatabase();
    const email = `test-${Date.now()}@hedger.test`;
    const user = await prisma.user.create({
      data: { email, passwordHash: await hashPassword('password123') },
    });
    userId = user.id;

    const company = await prisma.company.findUnique({ where: { ticker: 'MSFT' } });
    if (!company) throw new Error('Seed data missing: MSFT company not found');
    companyId = company.id;
  });

  afterAll(async () => {
    await prisma.valuationRun.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } }).catch(() => undefined);
    await disconnectDatabase();
  });

  it('saves a DCF run', async () => {
    const run = await saveValuationRun(userId, {
      ticker: 'MSFT',
      model: 'DCF',
      inputs: { wacc: 0.08 },
      result: { fairValuePerShare: 123.45 },
      confidence: 82,
      durationMs: 42,
    });
    expect(run.id).toBeTruthy();
    expect(run.model).toBe('DCF');
    expect(run.companyId).toBe(companyId);
    expect(run.userId).toBe(userId);
    runId = run.id;
  });

  it('lists runs for the user', async () => {
    const runs = await listValuationRuns(userId, {});
    expect(runs.length).toBeGreaterThanOrEqual(1);
    expect(runs.some(r => r.id === runId)).toBe(true);
  });

  it('filters runs by ticker', async () => {
    const runs = await listValuationRuns(userId, { ticker: 'MSFT' });
    expect(runs.every(r => r.company.ticker === 'MSFT')).toBe(true);
  });

  it('throws 404 for unknown ticker', async () => {
    await expect(saveValuationRun(userId, {
      ticker: 'ZZZZ',
      model: 'DCF',
      inputs: {},
      result: {},
    })).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects invalid model names', async () => {
    await expect(saveValuationRun(userId, {
      ticker: 'MSFT',
      model: 'NOT_A_MODEL',
      inputs: {},
      result: {},
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('gets a run by id', async () => {
    const run = await getValuationRun(userId, runId);
    expect(run.id).toBe(runId);
  });

  it('does not let another user read the run', async () => {
    const other = await prisma.user.create({
      data: { email: `other-${Date.now()}@hedger.test`, passwordHash: 'x' },
    });
    try {
      await expect(getValuationRun(other.id, runId)).rejects.toMatchObject({ statusCode: 404 });
    } finally {
      await prisma.user.delete({ where: { id: other.id } });
    }
  });

  it('deletes a run', async () => {
    await deleteValuationRun(userId, runId);
    await expect(getValuationRun(userId, runId)).rejects.toBeInstanceOf(AppError);
  });
});
