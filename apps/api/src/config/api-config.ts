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

const SECRET_KEY_LENGTH = 32;

const secretKeySchema = z
  .base64()
  .transform((key) => Buffer.from(key, 'base64'))
  .refine((key) => key.length === SECRET_KEY_LENGTH, {
    message: 'Must be 32 bytes in base64: generate one with openssl rand -base64 32',
  });

const apiEnvironmentSchema = z
  .object({
    DATABASE_URL: databaseUrlSchema,
    MAILBOX_SECRET_KEY: secretKeySchema,
    API_HOST: z.string().min(1).default('127.0.0.1'),
    API_PORT: portSchema.default(3000),
    // Unset in development, where Vite serves the web app itself.
    WEB_DIRECTORY: webDirectorySchema.optional(),
    LOG_LEVEL: logLevelSchema.default('info'),
  })
  .transform((environment) => ({
    databaseUrl: environment.DATABASE_URL,
    secretKey: environment.MAILBOX_SECRET_KEY,
    host: environment.API_HOST,
    port: environment.API_PORT,
    webDirectory: environment.WEB_DIRECTORY,
    logLevel: environment.LOG_LEVEL,
  }));

export type ApiConfig = z.output<typeof apiEnvironmentSchema>;

export function parseApiConfig(environment: Record<string, string | undefined>) {
  return apiEnvironmentSchema.safeParse(environment);
}
