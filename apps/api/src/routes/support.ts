import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';

export const supportRouter = Router();

export interface SupportTicket {
  id: string;
  userId?: string | undefined;
  userEmail: string;
  userName?: string | undefined;
  userPlan: string;
  category: string;
  symbol?: string | undefined;
  subject: string;
  message: string;
  status: 'assigned' | 'under_review' | 'resolved';
  slaHours: number;
  assignedAnalyst: string;
  createdAt: string;
  analystResponse?: string | undefined;
}

// In-memory ticket fallback store
const inMemoryTickets: SupportTicket[] = [
  {
    id: 'HEDG-8912',
    userEmail: 'institutional.desk@hedger.capital',
    userName: 'Hedger Desk',
    userPlan: 'ultra',
    category: 'Hamada Unlevering & Betas',
    symbol: 'NVDA',
    subject: 'Verification of CUDA software lock-in moat on operating margins',
    message: 'Requesting validation of 75% gross margin sustainability under Blackwell architecture rollout.',
    status: 'resolved',
    slaHours: 2,
    assignedAnalyst: 'Lead Quantitative Analyst (Valuation Desk)',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    analystResponse: 'Audited 10-K disclosures confirm datacenter segment gross margins at 76.2%. The Hamada unlevered asset beta of 1.25 reflects minimal financial leverage risk.'
  }
];

// Helper to determine SLA hours and desk
function getSlaConfig(plan: string): { slaHours: number; assignedAnalyst: string } {
  switch (plan?.toLowerCase()) {
    case 'ultra':
      return { slaHours: 2, assignedAnalyst: 'Dedicated Senior Valuation Lead' };
    case 'pro':
      return { slaHours: 6, assignedAnalyst: 'Priority Institutional Desk' };
    case 'plus':
      return { slaHours: 24, assignedAnalyst: 'Standard Quantitative Support Desk' };
    default:
      return { slaHours: 72, assignedAnalyst: 'Community Documentation Desk' };
  }
}

// GET /api/support/tickets
supportRouter.get('/tickets', async (req: Request, res: Response) => {
  const userHeader = req.headers['x-hedger-user-id'] as string;
  const userPlan = (req.headers['x-hedger-plan'] as string) || 'basic';

  // Return tickets
  res.json({
    success: true,
    plan: userPlan,
    tickets: inMemoryTickets
  });
});

// POST /api/support/tickets
supportRouter.post('/tickets', async (req: Request, res: Response) => {
  try {
    const { category, symbol, subject, message, email, name, plan } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const effectivePlan = plan || (req.headers['x-hedger-plan'] as string) || 'basic';
    const { slaHours, assignedAnalyst } = getSlaConfig(effectivePlan);

    const ticketId = `HEDG-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket: SupportTicket = {
      id: ticketId,
      userId: (req.headers['x-hedger-user-id'] as string) || undefined,
      userEmail: email || 'anonymous@hedger.capital',
      userName: name || 'Allocator',
      userPlan: effectivePlan,
      category: category || 'Valuation Methodology',
      symbol: symbol ? symbol.toUpperCase() : undefined,
      subject: subject.trim(),
      message: message.trim(),
      status: 'assigned',
      slaHours,
      assignedAnalyst,
      createdAt: new Date().toISOString(),
      analystResponse: `Your inquiry has been assigned to ${assignedAnalyst} with a guaranteed <${slaHours}h response SLA. Initial verification against our deterministic model documentation has commenced.`
    };

    inMemoryTickets.unshift(newTicket);

    res.status(201).json({
      success: true,
      ticket: newTicket
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit support ticket' });
  }
});
