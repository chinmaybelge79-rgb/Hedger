import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

declare module 'fastify' {
  interface FastifyRequest {
    id: string;
  }
}

export async function requestIdMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const requestId = (request.headers['x-request-id'] as string) || uuidv4();
  request.id = requestId;
  reply.header('x-request-id', requestId);
}

export function addRequestIdPlugin(fastify: FastifyInstance): void {
  fastify.addHook('onRequest', requestIdMiddleware);
}