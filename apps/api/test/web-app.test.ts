import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { errorResponseSchema } from '@mailbox/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type RunningApi, startApi } from './start-api.ts';

const asBrowserPage = { headers: { accept: 'text/html,application/xhtml+xml,*/*;q=0.8' } };

/** Starts the api serving a minimal built web app written to a temporary folder. */
async function startApiWithWebApp(): Promise<RunningApi> {
  const webDirectory = await mkdtemp(join(tmpdir(), 'mailbox-web-'));
  await mkdir(join(webDirectory, 'assets'));
  await writeFile(join(webDirectory, 'index.html'), '<!doctype html><title>MailBox</title>');
  await writeFile(join(webDirectory, 'assets', 'index-abc123.js'), 'export {};');
  await writeFile(join(webDirectory, 'sw.js'), 'self.skipWaiting;');
  const api = await startApi({ WEB_DIRECTORY: webDirectory });
  return {
    url: api.url,
    close: async () => {
      await api.close();
      await rm(webDirectory, { recursive: true, force: true });
    },
  };
}

describe('page navigation on the api', () => {
  let api: RunningApi;

  beforeAll(async () => {
    api = await startApiWithWebApp();
  });

  afterAll(async () => {
    await api.close();
  });

  it('answers every page with index.html, revalidated each time', async () => {
    const response = await fetch(`${api.url}/reception/thread-42`, asBrowserPage);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-cache');
    expect(await response.text()).toContain('<title>MailBox</title>');
  });

  it('keeps API errors in JSON', async () => {
    const response = await fetch(`${api.url}/api/does-not-exist`, asBrowserPage);

    expect(response.status).toBe(404);
    expect(errorResponseSchema.parse(await response.json()).code).toBe('ROUTE_NOT_FOUND');
  });

  it('keeps the health check in JSON', async () => {
    const response = await fetch(`${api.url}/health`, asBrowserPage);

    expect(await response.json()).toEqual({ status: 'ok' });
  });
});

describe('static files of the web app', () => {
  let api: RunningApi;

  beforeAll(async () => {
    api = await startApiWithWebApp();
  });

  afterAll(async () => {
    await api.close();
  });

  it('serves hashed assets with a one-year immutable cache', async () => {
    const response = await fetch(`${api.url}/assets/index-abc123.js`);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
  });

  it('serves the service worker without caching it', async () => {
    const response = await fetch(`${api.url}/sw.js`);

    expect(response.headers.get('cache-control')).toBe('no-cache');
  });

  it('answers a missing asset with 404 rather than with the page', async () => {
    const response = await fetch(`${api.url}/assets/missing.js`);

    expect(response.status).toBe(404);
  });
});
