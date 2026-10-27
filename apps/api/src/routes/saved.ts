import { Router } from 'express';
import { db } from '../db/database.js';
import { getSessionUser } from './auth.js';

export const savedRouter = Router();

savedRouter.get('/', async (req, res) => {
  const cookieToken = req.cookies?.hedger_session;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const token = bearerToken || cookieToken;

  const user = await getSessionUser(token);
  const models = await db.getSavedModels(user?.id);
  res.json({ saved: models });
});

savedRouter.get('/:id', async (req, res) => {
  const item = await db.getSavedModelById(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Saved model not found', id: req.params.id });
  }
  res.json(item);
});

savedRouter.post('/', async (req, res) => {
  const cookieToken = req.cookies?.hedger_session;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const token = bearerToken || cookieToken;
  const user = await getSessionUser(token);

  const { symbol, name, priceAtSave, currency, intrinsicValuePerShare, marginOfSafety, engineVersion, inputs, outputs, notes } = req.body;
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  const newEntry = await db.saveModel({
    id: `save-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: user?.id,
    symbol: symbol.toUpperCase(),
    name: name || symbol,
    savedAt: new Date().toISOString(),
    priceAtSave: Number(priceAtSave) || 0,
    currency: currency || 'USD',
    intrinsicValuePerShare: Number(intrinsicValuePerShare) || 0,
    marginOfSafety: Number(marginOfSafety) || 0,
    engineVersion: engineVersion || 'dcf-10y-v2.0-pure-decimal',
    inputs: inputs || {},
    outputs: outputs || undefined,
    notes: notes || ''
  });

  res.status(201).json(newEntry);
});

savedRouter.delete('/:id', async (req, res) => {
  const id = req.params.id;
  const success = await db.deleteSavedModel(id);
  const remaining = await db.getSavedModels();
  res.json({ success, remaining: remaining.length });
});
