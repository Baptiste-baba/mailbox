import * as z from 'zod';

/** Details of TOO_MANY_ATTEMPTS: how long to wait before the next try is allowed. */
export const tooManyAttemptsDetailsSchema = z.object({
  retryAfterSeconds: z.number().int().positive(),
});

export type TooManyAttemptsDetails = z.infer<typeof tooManyAttemptsDetailsSchema>;
