import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../../utils/errors';

export function validateBody<T>(schema: ZodSchema<T>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.body = schema.parse(request.body);
    } catch (error) {
      if (error instanceof ZodError) {
        throw AppError.validationError('Invalid request body', error.flatten().fieldErrors);
      }
      throw error;
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.query = schema.parse(request.query);
    } catch (error) {
      if (error instanceof ZodError) {
        throw AppError.validationError('Invalid query parameters', error.flatten().fieldErrors);
      }
      throw error;
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.params = schema.parse(request.params);
    } catch (error) {
      if (error instanceof ZodError) {
        throw AppError.validationError('Invalid route parameters', error.flatten().fieldErrors);
      }
      throw error;
    }
  };
}

export function validateAll(schemas: { body?: ZodSchema; query?: ZodSchema; params?: ZodSchema }) {
  const validators = [];
  if (schemas.body) validators.push(validateBody(schemas.body));
  if (schemas.query) validators.push(validateQuery(schemas.query));
  if (schemas.params) validators.push(validateParams(schemas.params));
  return validators;
}