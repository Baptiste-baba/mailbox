import { migrateDatabase } from '@mailbox/db';
import { pino } from 'pino';
import * as z from 'zod';
import { SetupService } from './auth/setup.service.ts';
import { type ApiConfig, parseApiConfig } from './config/api-config.ts';
import { createApp } from './create-app.ts';
import { DATABASE } from './database/database.module.ts';

// The configured logger only exists once the app is up: this one reports why startup failed.
const bootstrapLogger = pino();

// The schema is brought up to date before the first request: an api never serves an older database.
// Until the account exists, the setup code is in the logs from the start.
async function start(config: ApiConfig): Promise<void> {
  const app = await createApp(config);
  await migrateDatabase(app.get(DATABASE));
  await app.get(SetupService).issueNewCode();
  await app.listen(config.port, config.host);
}

const parsedConfig = parseApiConfig(process.env);

if (parsedConfig.success) {
  await start(parsedConfig.data).catch((error: unknown) => {
    bootstrapLogger.fatal({ err: error }, 'Startup failed');
    process.exitCode = 1;
  });
} else {
  const reason = z.prettifyError(parsedConfig.error);
  bootstrapLogger.fatal(`Invalid configuration, refusing to start:\n${reason}`);
  process.exitCode = 1;
}
