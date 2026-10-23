import { parseApiConfig } from '../src/config/api-config.js';
import { createApp } from '../src/create-app.js';

export interface RunningApi {
  url: string;
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
  return { url: await app.getUrl(), close: () => app.close() };
}
