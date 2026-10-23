import * as z from 'zod';

// Codes are part of the API contract: never rename or reuse one, only add new ones.
export const errorCodeSchema = z.enum([
  'VALIDATION_FAILED',
  'ROUTE_NOT_FOUND',
  'DATABASE_UNAVAILABLE',
  'INTERNAL_ERROR',
]);

export type ErrorCode = z.infer<typeof errorCodeSchema>;
