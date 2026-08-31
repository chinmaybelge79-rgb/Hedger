import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { prisma } from '@config/database';
import { redis } from '@config/redis';
import { createSuccessResponse } from '@api/schemas/response';

const healthQuerySchema = z.object({
  detailed: z.coerce.boolean().optional().default(false),
});

export async function healthRoutes(
  app: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  app.get('/health', {
    schema: {
      querystring: healthQuerySchema,
      tags: ['Health'],
      summary: 'Health check',
      description: 'Returns the health status of the API and its dependencies',
    },
  }, async (request, reply) => {
    const { detailed } = request.query as { detailed?: boolean };
    const requestId = request.id;

    const checks = {
      api: 'healthy',
      database: 'unknown',
      redis: 'unknown',
    };

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = 'healthy';
    } catch {
      checks.database = 'unhealthy';
      overallStatus = 'unhealthy';
    }

    try {
      await redis.ping();
      checks.redis = 'healthy';
    } catch {
      checks.redis = 'unhealthy';
      overallStatus = 'degraded';
    }

    const response = createSuccessResponse(
      {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks,
        ...(detailed && {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
        }),
      },
      requestId
    );

    if (overallStatus === 'unhealthy') {
      reply.status(503);
    } else if (overallStatus === 'degraded') {
      reply.status(200);
    }

    return reply.send(response);
  });

  app.get('/health/ready', {
    schema: {
      tags: ['Health'],
      summary: 'Readiness check',
      description: 'Returns whether the service is ready to accept traffic',
    },
  }, async (request, reply) => {
    const requestId = request.id;

    try {
      await prisma.$queryRaw`SELECT 1`;
      await redis.ping();

      return reply.send(createSuccessResponse(
        { status: 'ready', timestamp: new Date().toISOString() },
        requestId
      ));
    } catch {
      reply.status(503);
      return reply.send(createSuccessResponse(
        { status: 'not ready', timestamp: new Date().toISOString() },
        requestId
      ));
    }
  });

  app.get('/health/live', {
    schema: {
      tags: ['Health'],
      summary: 'Liveness check',
      description: 'Returns whether the service is alive',
    },
  }, async (request, reply) => {
    return reply.send(createSuccessResponse(
      { status: 'alive', timestamp: new Date().toISOString() },
      request.id
    ));
  });
}