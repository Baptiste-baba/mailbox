import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { databaseUrlSchema, logLevelSchema, portSchema, secretKeySchema } from '@mailbox/config';
import type { OauthClient } from '@mailbox/providers';
import * as z from 'zod';
import { appUrlSchema } from './app-url.ts';
import { trustedProxiesSchema } from './trusted-proxies.ts';

const webDirectorySchema = z
  .string()
  .min(1)
  .transform((directory) => resolve(directory))
  .refine((directory) => existsSync(join(directory, 'index.html')), {
    message: 'Must be the folder of the built web app, containing index.html',
  });

// Compose hands over a variable left unset as an empty text: the same as no variable.
const optionalTextSchema = z
  .string()
  .optional()
  .transform((text) => (text === '' ? undefined : text));

function oauthClient(
  clientId: string | undefined,
  clientSecret: string | undefined,
): OauthClient | undefined {
  return clientId === undefined || clientSecret === undefined
    ? undefined
    : { clientId, clientSecret };
}

const apiEnvironmentSchema = z
  .object({
    DATABASE_URL: databaseUrlSchema,
    MAILBOX_SECRET_KEY: secretKeySchema,
    MAILBOX_URL: appUrlSchema,
    API_HOST: z.string().min(1).default('127.0.0.1'),
    API_PORT: portSchema.default(3000),
    // Unset in development, where Vite serves the web app itself.
    WEB_DIRECTORY: webDirectorySchema.optional(),
    LOG_LEVEL: logLevelSchema.default('info'),
    // Unset, no X-Forwarded-For header is trusted: every request counts as the proxy's own.
    TRUSTED_PROXIES: trustedProxiesSchema.optional(),
    // Unset, no Gmail mailbox can be connected: the rest of the app works without them.
    GOOGLE_CLIENT_ID: optionalTextSchema,
    GOOGLE_CLIENT_SECRET: optionalTextSchema,
  })
  .refine(
    (environment) =>
      (environment.GOOGLE_CLIENT_ID === undefined) ===
      (environment.GOOGLE_CLIENT_SECRET === undefined),
    {
      message: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET together, or neither',
      path: ['GOOGLE_CLIENT_SECRET'],
    },
  )
  .transform((environment) => ({
    databaseUrl: environment.DATABASE_URL,
    secretKey: environment.MAILBOX_SECRET_KEY,
    appUrl: environment.MAILBOX_URL,
    host: environment.API_HOST,
    port: environment.API_PORT,
    webDirectory: environment.WEB_DIRECTORY,
    logLevel: environment.LOG_LEVEL,
    trustedProxies: environment.TRUSTED_PROXIES ?? [],
    google: oauthClient(environment.GOOGLE_CLIENT_ID, environment.GOOGLE_CLIENT_SECRET),
  }));

export type ApiConfig = z.output<typeof apiEnvironmentSchema>;

export function parseApiConfig(environment: Record<string, string | undefined>) {
  return apiEnvironmentSchema.safeParse(environment);
}
