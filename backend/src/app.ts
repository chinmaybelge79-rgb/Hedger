import Fastify, { FastifyInstance } from 'fastify';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { getEnv } from './config/env';
import { connectDatabase, disconnectDatabase, prisma } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './api/middleware/errorHandler';
import { addRequestIdPlugin } from './api/middleware/requestId';
import { healthRoutes } from './api/routes/health';
import { searchRoutes } from './api/routes/search';
import { companyRoutes } from './api/routes/companies';
import { marketRoutes } from './api/routes/market';
import { financialsRoutes } from './api/routes/financials';
import { valuationRoutes } from './api/routes/valuation';
import { analyticsRoutes } from './api/routes/analytics';
import { summaryRoutes } from './api/routes/summary';
import { providerRegistry } from './providers/base';
import { MockProvider } from './providers/mockProvider';
import { initializeJobWorkers } from './jobs/refreshJobs';

export async function buildApp(): Promise<FastifyInstance> {
  const env = getEnv();

  const app = Fastify({
    logger: false,
    requestIdHeader: 'x-request-id',
    genReqId: () => crypto.randomUUID(),
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: 'array',
      },
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    keyGenerator: (req) => req.ip,
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Hedger API',
        description: 'Institutional-grade valuation platform API',
        version: '1.0.0',
      },
      servers: [{ url: `http://${env.HOST}:${env.PORT}`, description: 'Development server' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
      tags: [
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Search', description: 'Company search and lookup' },
        { name: 'Companies', description: 'Company information and fundamentals' },
        { name: 'Market', description: 'Market data and prices' },
        { name: 'Financials', description: 'Financial statements and metrics' },
        { name: 'Valuation', description: 'Valuation models and analysis' },
        { name: 'Analytics', description: 'Risk, confidence, sensitivity, scenarios' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  });

  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  app.addHook('onRequest', async (request) => {
    (request as any).childLogger = logger.child({ requestId: request.id, path: request.url, method: request.method });
  });

  app.addHook('onResponse', async (request, reply) => {
    (request as any).childLogger?.info({ statusCode: reply.statusCode, responseTime: reply.elapsedTime }, 'Request completed');
  });

  await app.register(healthRoutes, { prefix: '/api/v1' });
  await app.register(searchRoutes, { prefix: '/api/v1' });
  await app.register(companyRoutes, { prefix: '/api/v1' });
  await app.register(marketRoutes, { prefix: '/api/v1' });
  await app.register(financialsRoutes, { prefix: '/api/v1' });
  await app.register(valuationRoutes, { prefix: '/api/v1' });
  await app.register(analyticsRoutes, { prefix: '/api/v1' });
  await app.register(summaryRoutes, { prefix: '/api/v1' });

  app.get('/api/v1', async () => ({
    name: 'Hedger API',
    version: '1.0.0',
    status: 'operational',
    docs: '/docs',
  }));

  return app;
}

export async function startServer(): Promise<void> {
  const env = getEnv();
  const app = await buildApp();

  await connectDatabase();
  await connectRedis();

  providerRegistry.register(new MockProvider());
  initializeJobWorkers();

  const gracefulShutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down...');
    await app.close();
    await disconnectDatabase();
    await disconnectRedis();
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    logger.info({ port: env.PORT, host: env.HOST }, '🚀 Server started');
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}