import { databaseUrlSchema, logLevelSchema, portSchema } from '@mailbox/config';
import * as z from 'zod';

const apiEnvironmentSchema = z
  .object({
    DATABASE_URL: databaseUrlSchema,
    API_HOST: z.string().min(1).default('127.0.0.1'),
    API_PORT: portSchema.default(3000),
    LOG_LEVEL: logLevelSchema.default('info'),
  })
  .transform((environment) => ({
    databaseUrl: environment.DATABASE_URL,
    host: environment.API_HOST,
    port: environment.API_PORT,
    logLevel: environment.LOG_LEVEL,
  }));

export type ApiConfig = z.output<typeof apiEnvironmentSchema>;

export function parseApiConfig(environment: Record<string, string | undefined>) {
  return apiEnvironmentSchema.safeParse(environment);
}
