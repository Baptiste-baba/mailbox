import { type Database, session } from '@mailbox/db';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { errorCode, sessionSetCookie } from './auth-requests.ts';
import { type RunningApi, startApi } from './start-api.ts';
import { signInOnFreshInstance } from './test-account.ts';
import { openTestDatabase } from './test-database.ts';

let api: RunningApi;
let database: Database;
let cookie: string;

function get(path: string, headers: Record<string, string> = {}) {
  return fetch(`${api.url}${path}`, { headers });
}

function postFrom(site: string | undefined, path: string, body: object) {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (site !== undefined) {
    headers.set('sec-fetch-site', site);
  }
  return fetch(`${api.url}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
}

beforeAll(async () => {
  api = await startApi();
  database = openTestDatabase();
});

afterAll(async () => {
  await api.close();
  await database.$client.end();
});

beforeEach(async () => {
  cookie = await signInOnFreshInstance(api, database);
});

describe('routes that need a session', () => {
  it.each(['/api/mailboxes', '/api/threads?view=inbox'])(
    'answers %s to the signed-in user only',
    async (path) => {
      const withoutSession = await get(path);
      expect(withoutSession.status).toBe(401);
      expect(await errorCode(withoutSession)).toBe('UNAUTHENTICATED');

      expect((await get(path, { cookie })).status).toBe(200);
    },
  );

  it('refuses an expired session', async () => {
    await database.update(session).set({ expiresAt: new Date(Date.now() - 1_000) });

    expect((await get('/api/mailboxes', { cookie })).status).toBe(401);
  });

  it.each(['/health', '/api/auth/status'])('answers %s without a session', async (path) => {
    expect((await get(path)).status).toBe(200);
  });

  it('signs out without a session, clearing the cookie all the same', async () => {
    const response = await postFrom('same-origin', '/api/auth/logout', {});

    expect(response.status).toBe(204);
    expect(sessionSetCookie(response)).toMatch(/Expires=Thu, 01 Jan 1970/);
  });
});

describe('pushing a session back', () => {
  it('reads a session used within the hour, without writing it nor its cookie', async () => {
    const [before] = await database.select().from(session);

    const response = await get('/api/mailboxes', { cookie });

    const [after] = await database.select().from(session);
    expect(after?.expiresAt).toEqual(before?.expiresAt);
    expect(sessionSetCookie(response)).toBeUndefined();
  });

  it('pushes back a session not used for an hour, and its cookie with it', async () => {
    await database.update(session).set({ expiresAt: new Date(Date.now() + 60_000) });

    const response = await get('/api/mailboxes', { cookie });

    const [after] = await database.select().from(session);
    const thirtyDaysAhead = Date.now() + 29 * 24 * 60 * 60 * 1_000;
    expect(after?.expiresAt.getTime()).toBeGreaterThan(thirtyDaysAhead);
    const expires = /Expires=([^;]+)/.exec(sessionSetCookie(response) ?? '')?.[1] ?? '';
    expect(new Date(expires).getTime()).toBeGreaterThan(thirtyDaysAhead);
  });
});

describe('requests sent by another site', () => {
  const credentials = { username: 'alex', password: 'any password' };

  it.each(['cross-site', 'same-site'])('refuses a change sent by a %s page', async (site) => {
    const response = await postFrom(site, '/api/auth/login', credentials);

    expect(response.status).toBe(403);
    expect(await errorCode(response)).toBe('CROSS_SITE_REQUEST');
  });

  it.each([
    ['sent by the app itself', 'same-origin'],
    ['without fetch metadata, as from a script', undefined],
  ])('lets through a change %s', async (_case, site) => {
    const response = await postFrom(site, '/api/auth/login', credentials);

    expect(await errorCode(response)).toBe('INVALID_CREDENTIALS');
  });

  it('lets another site read nothing more than its own pages could', async () => {
    expect((await get('/api/auth/status', { 'sec-fetch-site': 'cross-site' })).status).toBe(200);
  });
});
