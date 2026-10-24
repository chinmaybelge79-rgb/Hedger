import { Router } from 'express';
import { quotaBudgeter } from '../services/QuotaBudgeter.js';

export const devRouter = Router();

devRouter.get('/quota', (_req, res) => {
  res.json({
    status: 'ok',
    quotas: quotaBudgeter.getStatus(),
    timestamp: new Date().toISOString()
  });
});
