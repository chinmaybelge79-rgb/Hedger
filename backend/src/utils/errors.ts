export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: string, message: string, statusCode: number = 500, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(resource: string, identifier?: string): AppError {
    return new AppError(
      'NOT_FOUND',
      `${resource}${identifier ? ` (${identifier})` : ''} not found`,
      404
    );
  }

  static validationError(message: string, details?: unknown): AppError {
    return new AppError('VALIDATION_ERROR', message, 400, details);
  }

  static unauthorized(message: string = 'Unauthorized'): AppError {
    return new AppError('UNAUTHORIZED', message, 401);
  }

  static forbidden(message: string = 'Forbidden'): AppError {
    return new AppError('FORBIDDEN', message, 403);
  }

  static internal(message: string = 'Internal server error', details?: unknown): AppError {
    return new AppError('INTERNAL_ERROR', message, 500, details);
  }

  static providerError(provider: string, message: string): AppError {
    return new AppError('PROVIDER_ERROR', `${provider}: ${message}`, 502);
  }

  static rateLimited(retryAfter?: number): AppError {
    return new AppError('RATE_LIMITED', 'Too many requests', 429, { retryAfter });
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}