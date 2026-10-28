import { Router, Request, Response } from 'express';
import { nvidiaNimService, StockContext } from '../services/NvidiaNimService.js';
import { ThesisConverter, ExportFormat } from '../services/ThesisConverter.js';
import { MarketDataService } from '../services/MarketDataService.js';
import { getSessionUser } from './auth.js';
import { db } from '../db/database.js';

export const aiRouter = Router();
const marketData = new MarketDataService();

const PLAN_LIMITS = {
  basic: {
    maxAnalyses: 3,
    maxThesis: 1,
    maxDownloads: 0, // STRICTLY 0 FOR FREE USERS (cannot download anywhere)
    maxValuationVisits: 1
  },
  plus: {
    maxAnalyses: 3,
    maxThesis: 3,
    maxDownloads: 1, // 1 download per month
    maxValuationVisits: 999
  },
  pro: {
    maxAnalyses: 25,
    maxThesis: 25,
    maxDownloads: 10, // 10 downloads per month
    maxValuationVisits: 999
  },
  ultra: {
    maxAnalyses: 100,
    maxThesis: 50,
    maxDownloads: 20, // 20 downloads per month
    maxValuationVisits: 999
  }
};

function getMonthBucket(): string {
  return new Date().toISOString().substring(0, 7); // e.g. '2026-10'
}

async function resolveUserContext(req: Request): Promise<{
  id: string;
  plan: 'basic' | 'plus' | 'pro' | 'ultra';
  userId?: string | undefined;
}> {
  const cookieToken = req.cookies?.hedger_session;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const token = bearerToken || cookieToken;

  const clientPlan = req.headers['x-hedger-plan'] as string;
  let plan: 'basic' | 'plus' | 'pro' | 'ultra' = 'basic';
  let userId: string | undefined = undefined;

  if (clientPlan === 'basic' || clientPlan === 'plus' || clientPlan === 'pro' || clientPlan === 'ultra') {
    plan = clientPlan;
  }

  if (token) {
    const sessionUser = await getSessionUser(token);
    if (sessionUser) {
      userId = sessionUser.id;
      if (!clientPlan) {
        plan = sessionUser.plan;
      }
    }
  }

  const customUserId = req.headers['x-hedger-user-id'] as string;
  const id = customUserId || userId || token || (req.ip ? `ip_${req.ip}` : 'guest_default');
  return { id, plan, userId };
}

/**
 * 1. GET /api/ai/usage
 * Returns current user quotas and usage counts from PostgreSQL / Redis
 */
aiRouter.get('/usage', async (req: Request, res: Response) => {
  const { id, plan } = await resolveUserContext(req);
  const monthBucket = getMonthBucket();
  const usage = await db.getAiUsage(id, monthBucket);
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.basic;

  return res.json({
    plan,
    hasApiKey: nvidiaNimService.hasApiKey(),
    usage: {
      analysesUsed: usage.stockAnalysesCount,
      maxAnalyses: limits.maxAnalyses,
      thesisUsed: usage.thesisGeneratedCount,
      maxThesis: limits.maxThesis,
      downloadsUsed: usage.thesisDownloadsCount,
      maxDownloads: limits.maxDownloads,
      valuationVisits: usage.valuationVisitsCount,
      maxValuationVisits: limits.maxValuationVisits
    },
    entitlements: {
      canAnalyze: usage.stockAnalysesCount < limits.maxAnalyses,
      canGenerateThesis: usage.thesisGeneratedCount < limits.maxThesis,
      canDownload: limits.maxDownloads > 0 && usage.thesisDownloadsCount < limits.maxDownloads,
      canVisitValuation: usage.valuationVisitsCount < limits.maxValuationVisits
    }
  });
});

/**
 * 2. POST /api/ai/chat
 * Unlimited Fast Answering AI Assistant
 */
aiRouter.post('/chat', async (req: Request, res: Response) => {
  const { messages, context } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  try {
    const reply = await nvidiaNimService.chat(messages, { context });
    return res.json({
      reply,
      success: true
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Chat service error';
    return res.status(500).json({ error: message });
  }
});

/**
 * 2b. GET /api/ai/thesis/saved
 * Retrieves saved investment theses for the authenticated user
 */
aiRouter.get('/thesis/saved', async (req: Request, res: Response) => {
  const { userId } = await resolveUserContext(req);
  const models = await db.getSavedModels(userId);
  const thesisModels = models.filter((m) => m.engineVersion?.includes('Investment Thesis') || m.id.startsWith('save-thesis-'));
  return res.json({ savedTheses: thesisModels });
});

/**
 * 2c. GET /api/ai/thesis/:symbol
 * Fetch latest generated investment thesis for a stock
 */
aiRouter.get('/thesis/:symbol', async (req: Request, res: Response) => {
  const symbol = String(req.params.symbol).toUpperCase();
  const cached = await db.getThesis(symbol);
  if (!cached) {
    return res.status(404).json({ notFound: true, message: `No investment thesis generated for ${symbol} yet` });
  }
  return res.json({ success: true, ...cached });
});

/**
 * 3. POST /api/ai/thesis/generate
 * Live Stock Investment Thesis Generator
 */
aiRouter.post('/thesis/generate', async (req: Request, res: Response) => {
  const { symbol, userOverrides } = req.body;
  if (!symbol) {
    return res.status(400).json({ error: 'Stock symbol is required' });
  }

  const { id, plan, userId } = await resolveUserContext(req);
  const monthBucket = getMonthBucket();
  const usage = await db.getAiUsage(id, monthBucket);
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.basic;

  if (usage.thesisGeneratedCount >= limits.maxThesis) {
    return res.status(403).json({
      error: `Investment thesis limit reached for ${plan.toUpperCase()} plan (${usage.thesisGeneratedCount}/${limits.maxThesis} this month). Upgrade to Plus or Pro for additional generations.`,
      plan,
      upgradeRequired: true
    });
  }

  try {
    // 1. Resolve stock context & deterministic inputs
    const cleanSym = String(symbol).toUpperCase();
    const [profile, quote] = await Promise.all([
      marketData.getProfile(cleanSym),
      marketData.getQuote(cleanSym)
    ]);

    const context: StockContext = {
      symbol: cleanSym,
      name: profile?.name || cleanSym,
      currency: quote?.currency || profile?.currency || 'USD',
      exchange: profile?.exchange || 'NASDAQ',
      country: profile?.country || 'US',
      sector: profile?.sector || 'Technology',
      industry: profile?.industry || 'General',
      companyType: profile?.companyType || 'standard',
      price: quote?.price || 100,
      marketCap: (quote?.marketCap || profile?.marketCap) ?? undefined,
      peRatio: profile?.peRatio ?? undefined,
      dcfInputs: req.body.dcfInputs,
      analysis: req.body.analysis
    };

    // 2. Generate thesis using the exact Hedger Investment Thesis Template
    const thesisMarkdown = await nvidiaNimService.generateInvestmentThesis(context, userOverrides);

    // Save in Database
    await db.saveThesis(cleanSym, thesisMarkdown, userId);

    // 3. Increment thesis quota in Database
    const updatedUsage = await db.incrementAiUsage(id, monthBucket, 'thesis', userId);

    return res.json({
      success: true,
      symbol: cleanSym,
      thesis: thesisMarkdown,
      format: 'markdown',
      usage: {
        thesisUsed: updatedUsage.thesisGeneratedCount,
        maxThesis: limits.maxThesis,
        downloadsUsed: updatedUsage.thesisDownloadsCount,
        maxDownloads: limits.maxDownloads
      },
      entitlements: {
        canDownload: limits.maxDownloads > 0 && updatedUsage.thesisDownloadsCount < limits.maxDownloads,
        downloadRestrictedReason:
          limits.maxDownloads === 0
            ? 'Free tier users cannot download the investment thesis. Upgrade to Plus (1/mo), Pro (10/mo), or Ultra (20/mo).'
            : undefined
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Thesis generation failed';
    return res.status(500).json({ error: message });
  }
});

/**
 * 4. POST /api/ai/thesis/download
 * Gated Document Converter & Exporter (HTML / DOCX / Excel / Sheets / Markdown / PDF)
 * Free users are strictly forbidden from downloading, preventing inspect element circumvention.
 */
aiRouter.post('/thesis/download', async (req: Request, res: Response) => {
  const { symbol, thesis, format = 'pdf', title } = req.body;

  if (!thesis) {
    return res.status(400).json({ error: 'Thesis content is required for download' });
  }

  const { id, plan, userId } = await resolveUserContext(req);
  const monthBucket = getMonthBucket();
  const usage = await db.getAiUsage(id, monthBucket);
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.basic;

  // STRICT TIER ENFORCEMENT: Free tier CANNOT download under any circumstance
  if (limits.maxDownloads <= 0) {
    return res.status(403).json({
      error: 'Download restricted: Free tier accounts cannot download investment theses. Upgrade to Plus to download 1/mo, Pro for 10/mo, or Ultra for 20/mo.',
      plan,
      upgradeRequired: true
    });
  }

  if (usage.thesisDownloadsCount >= limits.maxDownloads) {
    return res.status(403).json({
      error: `Monthly download quota exhausted (${usage.thesisDownloadsCount}/${limits.maxDownloads} downloads used). Upgrade your tier to download more analyses.`,
      plan,
      downloadsUsed: usage.thesisDownloadsCount,
      maxDownloads: limits.maxDownloads,
      upgradeRequired: true
    });
  }

  // Consume download quota in Database
  await db.incrementAiUsage(id, monthBucket, 'downloads', userId);

  const cleanSym = (symbol || 'STOCK').toUpperCase();
  const docTitle = title || `${cleanSym} — Hedger Investment Thesis`;
  const exportFormat = (format.toLowerCase() as ExportFormat) || 'pdf';

  // AI Error Pre-Check & Auto-Repair for Table Alignment
  let formattedThesis = thesis;
  const validation = ThesisConverter.validateMarkdown(thesis);
  if (!validation.valid && validation.issues.length > 0) {
    console.warn('[Thesis Download] Table misalignment detected prior to export:', validation.issues);
    try {
      formattedThesis = await nvidiaNimService.repairThesisMarkdown(thesis, validation.issues.join('; '));
    } catch (repairPreErr) {
      console.warn('[Thesis Download] AI pre-repair failed, falling back to original:', repairPreErr);
    }
  }

  const generateExport = (content: string, fmt: ExportFormat) => {
    if (fmt === 'md') {
      return {
        type: 'text/markdown; charset=utf-8',
        filename: `${cleanSym}_Investment_Thesis.md`,
        data: content
      };
    }
    if (fmt === 'docx') {
      return {
        type: 'application/vnd.ms-word; charset=utf-8',
        filename: `${cleanSym}_Investment_Thesis.doc`,
        data: ThesisConverter.toDocxHtml(content, docTitle)
      };
    }
    if (fmt === 'excel') {
      return {
        type: 'text/csv; charset=utf-8',
        filename: `${cleanSym}_Investment_Thesis_Model.csv`,
        data: ThesisConverter.toExcelCsv(content, docTitle)
      };
    }
    if (fmt === 'sheets') {
      return {
        type: 'text/csv; charset=utf-8',
        filename: `${cleanSym}_Investment_Thesis_Sheets.csv`,
        data: ThesisConverter.toSheetsCsv(content, docTitle)
      };
    }
    // Default PDF / HTML
    return {
      type: 'text/html; charset=utf-8',
      filename: `${cleanSym}_Investment_Thesis_Institutional.html`,
      data: ThesisConverter.toInstitutionalPdfHtml(content, docTitle)
    };
  };

  try {
    const exportResult = generateExport(formattedThesis, exportFormat);
    res.setHeader('Content-Type', exportResult.type);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    return res.send(exportResult.data);
  } catch (exportErr: any) {
    console.error('[Thesis Download] Export generation error, invoking AI Repair Engine:', exportErr);
    try {
      const repairedThesis = await nvidiaNimService.repairThesisMarkdown(
        formattedThesis,
        exportErr?.message || 'Export formatting failed'
      );
      const retryResult = generateExport(repairedThesis, exportFormat);
      res.setHeader('Content-Type', retryResult.type);
      res.setHeader('Content-Disposition', `attachment; filename="${retryResult.filename}"`);
      return res.send(retryResult.data);
    } catch (aiRepairErr: any) {
      console.error('[Thesis Download] AI repair cascade also failed:', aiRepairErr);
      return res.status(500).json({
        error: `Export failed: ${exportErr?.message || 'Formatting error'}. AI auto-repair could not resolve document syntax.`,
        needsAiRepair: true
      });
    }
  }
});

/**
 * 4b. POST /api/ai/thesis/repair
 * On-demand AI Thesis Formatting & Error Repair Endpoint
 */
aiRouter.post('/thesis/repair', async (req: Request, res: Response) => {
  const { thesis, error, symbol } = req.body;
  if (!thesis) {
    return res.status(400).json({ error: 'Thesis content is required for AI repair' });
  }

  try {
    const repairedThesis = await nvidiaNimService.repairThesisMarkdown(
      thesis,
      error || 'Validate and fix table columns and markdown syntax'
    );
    return res.json({
      status: 'repaired',
      symbol: symbol || 'STOCK',
      repairedThesis
    });
  } catch (err: any) {
    const fallback = nvidiaNimService.deterministicMarkdownTableRepair(thesis);
    return res.json({
      status: 'fallback_repaired',
      symbol: symbol || 'STOCK',
      repairedThesis: fallback,
      warning: err?.message || 'AI repair completed with deterministic fallback'
    });
  }
});

/**
 * 5. POST /api/ai/financial-health
 * Light AI synthesis for 5-pillar financial health and quality analysis
 */
aiRouter.post('/financial-health', async (req: Request, res: Response) => {
  const { financials } = req.body;
  if (!financials) {
    return res.status(400).json({ error: 'Financial data payload is required' });
  }

  try {
    const commentary = await nvidiaNimService.analyzeFinancialHealth(financials);
    return res.json({ commentary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Health analysis failed';
    return res.status(500).json({ error: message });
  }
});

/**
 * 6. POST /api/ai/valuation-visit
 * Tracks valuation workbench visits according to plan rules in Database
 */
aiRouter.post('/valuation-visit', async (req: Request, res: Response) => {
  const { id, plan, userId } = await resolveUserContext(req);
  const monthBucket = getMonthBucket();
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.basic;

  const usage = await db.incrementAiUsage(id, monthBucket, 'visits', userId);

  return res.json({
    allowed: usage.valuationVisitsCount <= limits.maxValuationVisits,
    valuationVisits: usage.valuationVisitsCount,
    maxValuationVisits: limits.maxValuationVisits,
    plan
  });
});

/**
 * 7. POST /api/ai/config-key
 * Optional configuration for setting AI Provider API Keys at runtime
 */
aiRouter.post('/config-key', (req: Request, res: Response) => {
  const { apiKey, openRouterApiKey, geminiApiKey } = req.body;
  if (!apiKey && !openRouterApiKey && !geminiApiKey) {
    return res.status(400).json({ error: 'A valid API key is required' });
  }

  if (apiKey && typeof apiKey === 'string') {
    nvidiaNimService.setApiKey(apiKey);
  }
  if (openRouterApiKey && typeof openRouterApiKey === 'string') {
    nvidiaNimService.setOpenRouterApiKey(openRouterApiKey);
  }
  if (geminiApiKey && typeof geminiApiKey === 'string') {
    nvidiaNimService.setGeminiApiKey(geminiApiKey);
  }

  return res.json({ success: true, message: 'AI provider keys configured successfully' });
});

/**
 * 8. POST /api/ai/thesis/save
 * Persists the investment thesis and associated assumptions to the user's account in PostgreSQL
 */
aiRouter.post('/thesis/save', async (req: Request, res: Response) => {
  const { symbol, thesis, notes, intrinsicValue, currentPrice, currency } = req.body;
  if (!symbol || !thesis) {
    return res.status(400).json({ error: 'Symbol and thesis content are required' });
  }

  const { userId } = await resolveUserContext(req);
  const cleanSym = String(symbol).toUpperCase().trim();

  // 1. Save to hedger_theses table
  await db.saveThesis(cleanSym, thesis, userId);

  // 2. Also save to hedger_saved_models so it appears in Saved Models / Library on Profile Page
  const savedEntry = await db.saveModel({
    id: `save-thesis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: userId || undefined,
    symbol: cleanSym,
    name: `${cleanSym} Investment Thesis`,
    savedAt: new Date().toISOString(),
    priceAtSave: Number(currentPrice) || 0,
    currency: currency || 'USD',
    intrinsicValuePerShare: Number(intrinsicValue) || 0,
    marginOfSafety: 0,
    engineVersion: 'Institutional Investment Thesis (18-Section)',
    inputs: { thesisLength: thesis.length, generatedAt: new Date().toISOString() },
    notes: notes || `Institutional investment thesis generated for ${cleanSym}.`
  });

  return res.json({
    success: true,
    savedEntry,
    message: `Investment thesis for ${cleanSym} saved successfully.`
  });
});


