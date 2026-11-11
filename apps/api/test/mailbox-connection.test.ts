import { randomUUID } from 'node:crypto';
import type { Database } from '@mailbox/db';
import {
  mailboxAuthorizationSchema,
  mailboxSummarySchema,
  mailProviderListSchema,
} from '@mailbox/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { errorCode } from './auth-requests.ts';
import { type RunningApi, startApi } from './start-api.ts';
import { signInOnFreshInstance } from './test-account.ts';
import { letIdentityConfirmationAge, openTestDatabase } from './test-database.ts';

const NEW_MAILBOX = { provider: 'gmail', name: 'Perso', color: 'azur' };
const SIGNED_IN_AT_PROVIDER = { state: 'state-of-the-connection', code: 'code-of-the-provider' };

let api: RunningApi;
let database: Database;
let cookie: string;

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

/** Calls the api as the signed-in user, or as nobody with `session: false`. */
function call(method: string, path: string, body?: unknown, session = true): Promise<Response> {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (session) {
    headers.set('cookie', cookie);
  }
  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return fetch(`${api.url}/api${path}`, init);
}

const routes: [string, string, unknown][] = [
  ['GET', '/mail-providers', undefined],
  ['POST', '/mailboxes/connection', NEW_MAILBOX],
  ['POST', `/mailboxes/${randomUUID()}/reconnection`, undefined],
  ['POST', '/mailboxes/connection/completion', SIGNED_IN_AT_PROVIDER],
  ['DELETE', `/mailboxes/${randomUUID()}`, undefined],
];

describe('mailbox connection routes', () => {
  it.each(routes)('%s %s needs a session', async (method, path, body) => {
    const response = await call(method, path, body, false);

    expect(response.status).toBe(401);
    expect(await errorCode(response)).toBe('UNAUTHENTICATED');
  });

  it.each([
    ['adding a mailbox', 'POST', '/mailboxes/connection', NEW_MAILBOX],
    ['reconnecting a mailbox', 'POST', `/mailboxes/${randomUUID()}/reconnection`, undefined],
    ['removing a mailbox', 'DELETE', `/mailboxes/${randomUUID()}`, undefined],
  ])(
    '%s asks to confirm the identity once the last proof is ten minutes old',
    async (_case, method, path, body) => {
      await letIdentityConfirmationAge(database);

      const response = await call(method, path, body);

      expect(response.status).toBe(403);
      expect(await errorCode(response)).toBe('IDENTITY_CONFIRMATION_REQUIRED');
    },
  );

  it('lists the providers a mailbox can be added from', async () => {
    const response = await call('GET', '/mail-providers');

    expect(response.status).toBe(200);
    expect(mailProviderListSchema.parse(await response.json()).providers).toContain('gmail');
  });
});

describe('starting a connection', () => {
  it.each([
    ['to add a mailbox', '/mailboxes/connection', NEW_MAILBOX],
    ['to reconnect a mailbox', `/mailboxes/${randomUUID()}/reconnection`, undefined],
  ])('%s answers where to sign in at the provider', async (_case, path, body) => {
    const response = await call('POST', path, body);

    expect(response.status).toBe(200);
    expect(mailboxAuthorizationSchema.safeParse(await response.json()).success).toBe(true);
  });

  it.each([
    ['an unknown provider', { ...NEW_MAILBOX, provider: 'yahoo' }],
    ['a mailbox without a name', { ...NEW_MAILBOX, name: '   ' }],
    ['a name longer than the sidebar shows', { ...NEW_MAILBOX, name: 'x'.repeat(41) }],
    ['a colour out of the palette', { ...NEW_MAILBOX, color: 'red' }],
    ['no colour', { provider: 'gmail', name: 'Perso' }],
  ])('answers 400 VALIDATION_FAILED for %s', async (_case, body) => {
    const response = await call('POST', '/mailboxes/connection', body);

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe('VALIDATION_FAILED');
  });
});

describe('finishing a connection', () => {
  it('answers the mailbox, even when the last proof of identity is old', async () => {
    await letIdentityConfirmationAge(database);

    const response = await call('POST', '/mailboxes/connection/completion', SIGNED_IN_AT_PROVIDER);

    expect(response.status).toBe(200);
    expect(mailboxSummarySchema.safeParse(await response.json()).success).toBe(true);
  });

  it.each([
    ['no code', { state: 'state' }],
    ['no state', { code: 'code' }],
    ['a state longer than any the api gives', { state: 's'.repeat(201), code: 'code' }],
    ['a code longer than any a provider gives', { state: 'state', code: 'c'.repeat(2_001) }],
  ])('answers 400 VALIDATION_FAILED for %s', async (_case, body) => {
    const response = await call('POST', '/mailboxes/connection/completion', body);

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe('VALIDATION_FAILED');
  });
});

describe('a mailbox named in the address', () => {
  it('is removed', async () => {
    const response = await call('DELETE', `/mailboxes/${randomUUID()}`);

    expect(response.status).toBe(204);
  });

  it.each([
    ['removed', 'DELETE', '/mailboxes/mailbox-work'],
    ['reconnected', 'POST', '/mailboxes/mailbox-work/reconnection'],
  ])('cannot be %s under an id that cannot be one', async (_case, method, path) => {
    const response = await call(method, path);

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe('VALIDATION_FAILED');
  });
});
