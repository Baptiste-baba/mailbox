import { resolve } from 'node:path';
import { databaseUrlSchema, logLevelSchema, portSchema } from '@mailbox/config';
import * as z from 'zod';

const workerEnvironmentSchema = z
  .object({
    DATABASE_URL: databaseUrlSchema,
    BACKUP_DIRECTORY: z.string().min(1),
    WORKER_HEALTH_PORT: portSchema.default(3001),
    LOG_LEVEL: logLevelSchema.default('info'),
  })
  .transform((environment) => ({
    databaseUrl: environment.DATABASE_URL,
    backupDirectory: resolve(environment.BACKUP_DIRECTORY),
    healthPort: environment.WORKER_HEALTH_PORT,
    logLevel: environment.LOG_LEVEL,
  }));

export type WorkerConfig = z.output<typeof workerEnvironmentSchema>;

export function parseWorkerConfig(environment: Record<string, string | undefined>) {
  return workerEnvironmentSchema.safeParse(environment);
}
