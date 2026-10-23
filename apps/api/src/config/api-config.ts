import * as z from 'zod';

const logLevelSchema = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']);

const apiEnvironmentSchema = z
  .object({
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    API_HOST: z.string().min(1).default('127.0.0.1'),
    API_PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
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
