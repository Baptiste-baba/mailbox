import { pino } from 'pino';
import * as z from 'zod';
import { type ApiConfig, parseApiConfig } from './config/api-config.js';
import { createApp } from './create-app.js';

// The configured logger only exists once the app is up: this one reports why startup failed.
const bootstrapLogger = pino();

async function start(config: ApiConfig): Promise<void> {
  const app = await createApp(config);
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
