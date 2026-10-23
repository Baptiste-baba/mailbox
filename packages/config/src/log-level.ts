import * as z from 'zod';

export const logLevelSchema = z.enum([
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
]);

export type LogLevel = z.infer<typeof logLevelSchema>;
