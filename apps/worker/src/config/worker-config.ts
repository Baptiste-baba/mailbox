import { resolve } from 'node:path';
import {
  databaseUrlSchema,
  googleClientOf,
  googleClientVariables,
  HALF_GOOGLE_CLIENT_ISSUE,
  isWholeGoogleClient,
  logLevelSchema,
  portSchema,
  secretKeySchema,
} from '@mailbox/config';
import * as z from 'zod';

const workerEnvironmentSchema = z
  .object({
    DATABASE_URL: databaseUrlSchema,
    // Opens the tokens the api sealed: the same key as the api's.
    MAILBOX_SECRET_KEY: secretKeySchema,
    BACKUP_DIRECTORY: z.string().min(1),
    WORKER_HEALTH_PORT: portSchema.default(3001),
    LOG_LEVEL: logLevelSchema.default('info'),
    // Unset, no Gmail mailbox can be read: backups go on without them.
    ...googleClientVariables,
  })
  .refine(isWholeGoogleClient, HALF_GOOGLE_CLIENT_ISSUE)
  .transform((environment) => ({
    databaseUrl: environment.DATABASE_URL,
    secretKey: environment.MAILBOX_SECRET_KEY,
    backupDirectory: resolve(environment.BACKUP_DIRECTORY),
    healthPort: environment.WORKER_HEALTH_PORT,
    logLevel: environment.LOG_LEVEL,
    google: googleClientOf(environment),
  }));

export type WorkerConfig = z.output<typeof workerEnvironmentSchema>;

export function parseWorkerConfig(environment: Record<string, string | undefined>) {
  return workerEnvironmentSchema.safeParse(environment);
}
