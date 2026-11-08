import type { NestExpressApplication } from '@nestjs/platform-express';
import { parseApiConfig } from '../src/config/api-config.ts';
import { createApp } from '../src/create-app.ts';

export interface RunningApi {
  url: string;
  /** Reaches a service directly, for the steps `main.ts` runs before the api listens. */
  get: NestExpressApplication['get'];
  close: () => Promise<void>;
}

/** Starts the real api on a free port, configured from the test environment plus the given overrides. */
export async function startApi(overrides: Record<string, string> = {}): Promise<RunningApi> {
  const parsedConfig = parseApiConfig({ ...process.env, ...overrides });
  if (!parsedConfig.success) {
    throw parsedConfig.error;
  }
  const app = await createApp(parsedConfig.data);
  await app.listen(0, '127.0.0.1');
  return { url: await app.getUrl(), get: app.get.bind(app), close: () => app.close() };
}
