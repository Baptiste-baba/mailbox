import * as z from 'zod';
import { errorCodeSchema } from './error-code.js';

export const errorResponseSchema = z.object({
  code: errorCodeSchema,
  // Meant for developers and logs: the UI derives its French text from `code`.
  message: z.string(),
  details: z.unknown().optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
