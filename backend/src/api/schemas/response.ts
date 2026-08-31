export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  requestId: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  requestId: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function createSuccessResponse<T>(data: T, requestId: string): ApiResponse<T> {
  return {
    success: true,
    data,
    requestId,
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(error: ApiError): ApiResponse<never> {
  return {
    success: false,
    error,
    requestId: error.requestId,
    timestamp: new Date().toISOString(),
  };
}