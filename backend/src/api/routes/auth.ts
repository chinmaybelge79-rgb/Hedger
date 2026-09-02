import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '@config/database';
import { signupSchema, loginSchema, watchlistAddSchema } from '@api/schemas/auth';
import { hashPassword, verifyPassword, signJwt, verifyJwt } from '@utils/auth';
import { requireAuth, authenticateLight } from '@api/middleware/auth';
import { createSuccessResponse } from '@api/schemas/response';
import { AppError } from '@utils/errors';

function publicUser(u: { id: string; email: string; displayName: string | null; plan: string; createdAt: Date }) {
  return { id: u.id, email: u.email, displayName: u.displayName, plan: u.plan, createdAt: u.createdAt };
}

export async function authRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  app.post('/auth/signup', {
    schema: {
      body: signupSchema,
      tags: ['Auth'],
      summary: 'Create account',
      description: 'Register a new user account with email and password',
    },
  }, async (request, reply) => {
    const { email, password, displayName } = request.body as { email: string; password: string; displayName?: string };

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      throw AppError.validationError('An account with this email already exists');
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), passwordHash, displayName },
    });

    const token = signJwt({ sub: user.id, email: user.email });
    return reply.status(201).send(createSuccessResponse({ user: publicUser(user), token }, request.id));
  });

  app.post('/auth/login', {
    schema: {
      body: loginSchema,
      tags: ['Auth'],
      summary: 'Sign in',
      description: 'Authenticate with email and password',
    },
  }, async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new AppError('UNAUTHORIZED', 'Invalid email or password', 401);
    }
    const token = signJwt({ sub: user.id, email: user.email });
    return reply.send(createSuccessResponse({ user: publicUser(user), token }, request.id));
  });

  app.get('/auth/me', {
    schema: {
      tags: ['Auth'],
      summary: 'Get current user',
      description: 'Return the authenticated user profile',
    },
  }, async (request, reply) => {
    const user = await requireAuth(request);
    return reply.send(createSuccessResponse({ user }, request.id));
  });

  // Attach a provisional user (JWT parsed, no DB hit) for downstream optional use
  app.addHook('onRequest', async (request) => {
    request.user = authenticateLight(request) ?? undefined;
  });

  // ---- Watchlist (protected) ----
  app.get('/watchlist', {
    schema: { tags: ['Watchlist'], summary: 'List watchlist items' },
  }, async (request, reply) => {
    const user = await requireAuth(request);
    const items = await prisma.watchlistItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(createSuccessResponse({ items }, request.id));
  });

  app.post('/watchlist', {
    schema: { body: watchlistAddSchema, tags: ['Watchlist'], summary: 'Add ticker to watchlist' },
  }, async (request, reply) => {
    const user = await requireAuth(request);
    const { ticker, note, targetPrice } = request.body as { ticker: string; note?: string; targetPrice?: number };

    const company = await prisma.company.findUnique({ where: { ticker } });
    if (!company) throw AppError.notFound('Company', ticker);

    const item = await prisma.watchlistItem.upsert({
      where: { userId_ticker: { userId: user.id, ticker } },
      create: { userId: user.id, ticker, note, targetPrice },
      update: { note, targetPrice },
    });
    return reply.status(201).send(createSuccessResponse({ item }, request.id));
  });

  app.delete('/watchlist/:ticker', {
    schema: { tags: ['Watchlist'], summary: 'Remove ticker from watchlist' },
  }, async (request, reply) => {
    const user = await requireAuth(request);
    const { ticker } = request.params as { ticker: string };
    await prisma.watchlistItem.deleteMany({ where: { userId: user.id, ticker: ticker.toUpperCase() } });
    return reply.send(createSuccessResponse({ removed: ticker.toUpperCase() }, request.id));
  });
}

// Export for use in other route files that want optional auth
export { verifyJwt };
