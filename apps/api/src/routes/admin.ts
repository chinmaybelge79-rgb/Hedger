import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';

export const adminRouter = Router();

// Store active admin sessions in memory
const adminSessions = new Set<string>();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'GODDESS';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || 'a05a0d1d016fee4d2aee00b44a0eeeb2fa251a646927d186b4a903b703a3b30d';

function verifyAdminCredentials(user: string, pass: string): boolean {
  if (user.trim() !== ADMIN_USERNAME) return false;
  const hash = crypto.createHash('sha256').update(pass).digest('hex');
  const bufA = Buffer.from(hash);
  const bufB = Buffer.from(ADMIN_PASSWORD_HASH);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

// Middleware to protect admin routes
function requireAdmin(req: Request, res: Response, next: () => void) {
  const cookieToken = req.cookies?.hedger_admin_token;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const token = bearerToken || cookieToken;

  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({ error: 'Administrative authentication required' });
  }
  next();
}

/**
 * 1. Admin Authentication Login
 */
adminRouter.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (!verifyAdminCredentials(username, password)) {
    await db.logActivity(undefined, 'ADMIN_LOGIN_FAILED', { usernameAttempt: username }, req.ip);
    return res.status(401).json({ error: 'Invalid administrative credentials' });
  }

  const token = `adm_${crypto.randomBytes(32).toString('hex')}`;
  adminSessions.add(token);

  res.cookie('hedger_admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });

  await db.logActivity(undefined, 'ADMIN_LOGIN_SUCCESS', { username: ADMIN_USERNAME }, req.ip);

  return res.json({
    success: true,
    token,
    user: {
      username: ADMIN_USERNAME,
      role: 'SUPER_ADMINISTRATOR'
    }
  });
});

/**
 * 2. Admin Logout
 */
adminRouter.post('/logout', (req: Request, res: Response) => {
  const token = req.cookies?.hedger_admin_token || req.headers.authorization?.substring(7);
  if (token) adminSessions.delete(token);
  res.clearCookie('hedger_admin_token');
  res.json({ success: true });
});

/**
 * 3. Verify Admin Session Status
 */
adminRouter.get('/me', (req: Request, res: Response) => {
  const cookieToken = req.cookies?.hedger_admin_token;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const token = bearerToken || cookieToken;

  if (!token || !adminSessions.has(token)) {
    return res.json({ authenticated: false });
  }

  return res.json({
    authenticated: true,
    user: {
      username: ADMIN_USERNAME,
      role: 'SUPER_ADMINISTRATOR'
    }
  });
});

/**
 * 4. System Overview & Metrics
 */
adminRouter.get('/metrics', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await db.getUsersWithTelemetry();
    const sessions = await db.getAllSessions();

    const planCounts = {
      ultra: users.filter(u => u.plan === 'ultra').length,
      pro: users.filter(u => u.plan === 'pro').length,
      plus: users.filter(u => u.plan === 'plus').length,
      basic: users.filter(u => u.plan === 'basic').length
    };

    const totalModels = users.reduce((acc, u) => acc + (u.savedModelsCount || 0), 0);
    const totalTheses = users.reduce((acc, u) => acc + (u.thesesGeneratedCount || 0), 0);
    const totalDownloads = users.reduce((acc, u) => acc + (u.thesesDownloadedCount || 0), 0);

    return res.json({
      success: true,
      metrics: {
        totalUsers: users.length,
        planCounts,
        activeSessionsCount: sessions.length,
        totalModelsSaved: totalModels,
        totalThesesGenerated: totalTheses,
        totalDownloads: totalDownloads
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 5. Full User Directory with Telemetry
 */
adminRouter.get('/users', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await db.getUsersWithTelemetry();
    return res.json({ success: true, users });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 6. Subscription Upgrade / Degrade Modifier
 */
adminRouter.patch('/users/:id/plan', requireAdmin, async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { plan } = req.body;

  if (!['basic', 'plus', 'pro', 'ultra'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid subscription tier' });
  }

  try {
    const updated = await db.updateUserPlan(id, plan);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      success: true,
      message: `User ${updated.name} subscription updated to ${plan.toUpperCase()}`,
      user: updated
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 7. Delete User
 */
adminRouter.delete('/users/:id', requireAdmin, async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const ok = await db.deleteUser(id);
    if (!ok) return res.status(404).json({ error: 'User could not be deleted' });
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 8. User Steps & Audit Logs
 */
adminRouter.get('/logs', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const logs = await db.getActivityLogs(limit);
    return res.json({ success: true, logs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 9. Active Sessions Monitor
 */
adminRouter.get('/sessions', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const sessions = await db.getAllSessions();
    return res.json({ success: true, sessions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 10. Revoke Session
 */
adminRouter.delete('/sessions/:token', requireAdmin, async (req: Request, res: Response) => {
  const token = String(req.params.token);
  try {
    await db.deleteSession(token);
    return res.json({ success: true, message: 'Session terminated' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
