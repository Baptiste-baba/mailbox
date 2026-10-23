import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { databaseUrlSchema, logLevelSchema, portSchema } from '@mailbox/config';
import * as z from 'zod';

const webDirectorySchema = z
  .string()
  .min(1)
  .transform((directory) => resolve(directory))
  .refine((directory) => existsSync(join(directory, 'index.html')), {
    message: 'Must be the folder of the built web app, containing index.html',
  });

const apiEnvironmentSchema = z
  .object({
    DATABASE_URL: databaseUrlSchema,
    API_HOST: z.string().min(1).default('127.0.0.1'),
    API_PORT: portSchema.default(3000),
    // Unset in development, where Vite serves the web app itself.
    WEB_DIRECTORY: webDirectorySchema.optional(),
    LOG_LEVEL: logLevelSchema.default('info'),
  })
  .transform((environment) => ({
    databaseUrl: environment.DATABASE_URL,
    host: environment.API_HOST,
    port: environment.API_PORT,
    webDirectory: environment.WEB_DIRECTORY,
    logLevel: environment.LOG_LEVEL,
  }));

export type ApiConfig = z.output<typeof apiEnvironmentSchema>;

export function parseApiConfig(environment: Record<string, string | undefined>) {
  return apiEnvironmentSchema.safeParse(environment);
}
