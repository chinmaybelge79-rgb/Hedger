import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AppError, isAppError } from '../../utils/errors';
import { createErrorResponse, ApiError } from '../schemas/response';
import { logger, createChildLogger } from '../../config/logger';

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const requestId = request.id as string;
  const childLogger = createChildLogger({ requestId, path: request.url, method: request.method });

  let apiError: ApiError;

  if (isAppError(error)) {
    apiError = {
      code: error.code,
      message: error.message,
      details: error.details,
      requestId,
    };
    childLogger.warn({ error: apiError }, 'Application error');
    return reply.status(error.statusCode).send(createErrorResponse(apiError));
  }

  if (error.validation) {
    apiError = {
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: error.validation,
      requestId,
    };
    childLogger.warn({ error: apiError }, 'Validation error');
    return reply.status(400).send(createErrorResponse(apiError));
  }

  if (error.code === 'FST_ERR_RATE_LIMIT') {
    apiError = {
      code: 'RATE_LIMITED',
      message: 'Too many requests',
      requestId,
    };
    childLogger.warn({ error: apiError }, 'Rate limited');
    return reply.status(429).send(createErrorResponse(apiError));
  }

  childLogger.error({ err: error }, 'Unhandled error');
  apiError = {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    requestId,
  };
  return reply.status(500).send(createErrorResponse(apiError));
}

export function notFoundHandler(request: FastifyRequest, reply: FastifyReply): void {
  const requestId = request.id as string;
  const apiError: ApiError = {
    code: 'NOT_FOUND',
    message: `Route ${request.method} ${request.url} not found`,
    requestId,
  };
  reply.status(404).send(createErrorResponse(apiError));
}