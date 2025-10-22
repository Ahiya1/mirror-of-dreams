// types/api.ts - API response types

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Error response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Success response with message
 */
export interface SuccessResponse {
  success: true;
  message: string;
  timestamp?: string;
}
