import { Router } from 'express';

export const savedRouter = Router();

// In-memory persistent store for saved analyses (Phase 18)
interface SavedAnalysis {
  id: string;
  symbol: string;
  name: string;
  savedAt: string;
  priceAtSave: number;
  currency: string;
  intrinsicValuePerShare: number;
  marginOfSafety: number;
  inputs: Record<string, any>;
  notes?: string;
}

let savedStore: SavedAnalysis[] = [
  {
    id: 'seed-1',
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd',
    savedAt: new Date(Date.now() - 86400000).toISOString(),
    priceAtSave: 1195.0,
    currency: 'INR',
    intrinsicValuePerShare: 1350.0,
    marginOfSafety: 0.1297,
    inputs: {
      wacc: 0.11,
      terminalGrowthRate: 0.05,
      operatingMargin: 0.18
    },
    notes: 'Base case assumption with 11% cost of capital and 5% terminal growth.'
  }
];

savedRouter.get('/', (_req, res) => {
  res.json({ saved: savedStore });
});

savedRouter.post('/', (req, res) => {
  const { symbol, name, priceAtSave, currency, intrinsicValuePerShare, marginOfSafety, inputs, notes } = req.body;
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  const newEntry: SavedAnalysis = {
    id: `save-${Date.now()}`,
    symbol,
    name: name || symbol,
    savedAt: new Date().toISOString(),
    priceAtSave: Number(priceAtSave) || 0,
    currency: currency || 'INR',
    intrinsicValuePerShare: Number(intrinsicValuePerShare) || 0,
    marginOfSafety: Number(marginOfSafety) || 0,
    inputs: inputs || {},
    notes: notes || ''
  };

  savedStore.unshift(newEntry);
  res.status(201).json(newEntry);
});

savedRouter.delete('/:id', (req, res) => {
  const id = req.params.id;
  savedStore = savedStore.filter((item) => item.id !== id);
  res.json({ success: true, remaining: savedStore.length });
});
