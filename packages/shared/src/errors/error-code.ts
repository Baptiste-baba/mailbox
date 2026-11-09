import * as z from 'zod';

// Codes are part of the API contract: never rename or reuse one, only add new ones.
export const errorCodeSchema = z.enum([
  'VALIDATION_FAILED',
  'PAYLOAD_TOO_LARGE',
  'UNAUTHENTICATED',
  'INVALID_CREDENTIALS',
  'SECOND_FACTOR_REQUIRED',
  'INVALID_SECOND_FACTOR',
  'TOO_MANY_ATTEMPTS',
  'SETUP_NOT_AVAILABLE',
  'SETUP_REQUIRED',
  'INVALID_SETUP_CODE',
  'CROSS_SITE_REQUEST',
  'ROUTE_NOT_FOUND',
  'THREAD_NOT_FOUND',
  'DATABASE_UNAVAILABLE',
  'INTERNAL_ERROR',
]);

export type ErrorCode = z.infer<typeof errorCodeSchema>;
