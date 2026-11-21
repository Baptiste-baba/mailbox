import { createHash, randomUUID } from 'node:crypto';
import type { Database } from '@mailbox/db';
import { mailboxListSchema, mailboxSummarySchema, mailProviderListSchema } from '@mailbox/shared';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorCode } from './auth-requests.ts';
import { type FakeGoogle, installFakeGoogle } from './fake-google.ts';
import {
  type ApiCaller,
  callApi,
  completeConnection,
  NEW_MAILBOX,
  startConnection,
  TEST_GOOGLE_CLIENT,
} from './mailbox-requests.ts';
import { type RunningApi, startApi } from './start-api.ts';
import { signInOnFreshInstance } from './test-account.ts';
import { letIdentityConfirmationAge, openTestDatabase } from './test-database.ts';
import { insertTestMailbox, resetMailTables, storedMailbox } from './test-mail.ts';

const COMPLETION = { state: 'state-of-the-connection', code: 'code-of-the-provider' };

let api: RunningApi;
let database: Database;
let user: ApiCaller;
let google: FakeGoogle;

beforeAll(async () => {
  api = await startApi(TEST_GOOGLE_CLIENT);
  database = openTestDatabase();
});

afterAll(async () => {
  await resetMailTables(database);
  await api.close();
  await database.$client.end();
});

beforeEach(async () => {
  google = installFakeGoogle();
  await resetMailTables(database);
  user = { api, cookie: await signInOnFreshInstance(api, database) };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function listedMailboxes() {
  const response = await callApi(user, 'GET', '/mailboxes');
  return mailboxListSchema.parse(await response.json()).mailboxes;
}

const routes: [string, string, unknown][] = [
  ['GET', '/mail-providers', undefined],
  ['POST', '/mailboxes/connection', NEW_MAILBOX],
  ['POST', `/mailboxes/${randomUUID()}/reconnection`, undefined],
  ['POST', '/mailboxes/connection/completion', COMPLETION],
  ['DELETE', `/mailboxes/${randomUUID()}`, undefined],
];

describe('mailbox connection routes', () => {
  it.each(routes)('%s %s needs a session', async (method, path, body) => {
    const response = await callApi({ api }, method, path, body);

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

      const response = await callApi(user, method, path, body);

      expect(response.status).toBe(403);
      expect(await errorCode(response)).toBe('IDENTITY_CONFIRMATION_REQUIRED');
    },
  );

  it('lists the providers this server has a client for', async () => {
    const response = await callApi(user, 'GET', '/mail-providers');

    expect(mailProviderListSchema.parse(await response.json()).providers).toEqual(['gmail']);
  });
});

describe('starting to add a mailbox', () => {
  it('answers the page of Google to sign in at, for this installation', async () => {
    const url = await startConnection(user);

    expect(`${url.origin}${url.pathname}`).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url.searchParams.get('client_id')).toBe(TEST_GOOGLE_CLIENT.GOOGLE_CLIENT_ID);
    expect(url.searchParams.get('redirect_uri')).toBe('https://mail.example/mailbox-connection');
    expect(url.searchParams.get('login_hint')).toBeNull();
  });

  it('names each connection by a state of its own', async () => {
    const first = await startConnection(user);
    const second = await startConnection(user);

    expect(first.searchParams.get('state')).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second.searchParams.get('state')).not.toBe(first.searchParams.get('state'));
  });

  it.each([
    ['an unknown provider', { ...NEW_MAILBOX, provider: 'yahoo' }],
    ['a mailbox without a name', { ...NEW_MAILBOX, name: '   ' }],
    ['a name longer than the sidebar shows', { ...NEW_MAILBOX, name: 'x'.repeat(41) }],
    ['a colour out of the palette', { ...NEW_MAILBOX, color: 'red' }],
    ['no colour', { provider: 'gmail', name: 'Perso' }],
  ])('answers 400 VALIDATION_FAILED for %s', async (_case, body) => {
    const response = await callApi(user, 'POST', '/mailboxes/connection', body);

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe('VALIDATION_FAILED');
  });
});

describe('finishing to add a mailbox', () => {
  it('answers the mailbox, under the name and the colour chosen', async () => {
    const response = await completeConnection(user, await startConnection(user));

    expect(response.status).toBe(200);
    const mailbox = mailboxSummarySchema.parse(await response.json());
    expect(mailbox).toMatchObject({
      provider: 'gmail',
      name: 'Perso',
      color: 'azur',
      address: 'alex.martin@example.com',
      unreadCount: 0,
      status: 'connected',
    });
    expect(await listedMailboxes()).toEqual([mailbox]);
  });

  it('keeps the token of the mailbox encrypted, and to itself', async () => {
    const response = await completeConnection(user, await startConnection(user));

    const answer = await response.text();
    const stored = await storedMailbox(database, mailboxSummarySchema.parse(JSON.parse(answer)).id);
    expect(stored?.refreshToken).toBe('refresh-token-1');
    expect(stored?.refreshTokenEncrypted).not.toContain('refresh-token-1');
    expect(answer).not.toContain('refresh-token-1');
  });

  it('does not ask to confirm the identity again, however old the last proof', async () => {
    const url = await startConnection(user);
    await letIdentityConfirmationAge(database);

    const response = await completeConnection(user, url);

    expect(response.status).toBe(200);
  });
});

describe('what Google is told to finish a connection', () => {
  it('proves that the code is redeemed by who asked for it', async () => {
    const url = await startConnection(user);

    await completeConnection(user, url);

    const sent = google.redemptions[0];
    expect(sent?.get('code')).toBe('code-of-the-provider');
    expect(sent?.get('redirect_uri')).toBe('https://mail.example/mailbox-connection');
    const challenge = createHash('sha256')
      .update(sent?.get('code_verifier') ?? '')
      .digest('base64url');
    expect(challenge).toBe(url.searchParams.get('code_challenge'));
  });
});

describe('adding a mailbox whose address is already connected', () => {
  it('gives that mailbox its access back, with the name and the colour it had', async () => {
    const mailboxId = await insertTestMailbox(database, {
      name: 'Ancienne',
      address: 'alex.martin@example.com',
      status: 'reconnect_required',
    });

    const response = await completeConnection(user, await startConnection(user));

    expect(mailboxSummarySchema.parse(await response.json())).toMatchObject({
      id: mailboxId,
      name: 'Ancienne',
      color: 'navy',
      status: 'connected',
    });
    expect((await storedMailbox(database, mailboxId))?.refreshToken).toBe('refresh-token-1');
    expect(await listedMailboxes()).toHaveLength(1);
  });
});

describe('a connection that cannot be finished', () => {
  it('is one the api never started', async () => {
    const response = await callApi(user, 'POST', '/mailboxes/connection/completion', COMPLETION);

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe('MAILBOX_CONNECTION_FAILED');
    expect(google.redemptions).toHaveLength(0);
  });

  it('is one already finished', async () => {
    const url = await startConnection(user);
    await completeConnection(user, url);

    const response = await completeConnection(user, url);

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe('MAILBOX_CONNECTION_FAILED');
    expect(await listedMailboxes()).toHaveLength(1);
  });

  it('is one whose code Google refuses: no mailbox is stored', async () => {
    google.refusesCodes = true;

    const response = await completeConnection(user, await startConnection(user));

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe('MAILBOX_CONNECTION_FAILED');
    expect(await listedMailboxes()).toEqual([]);
  });

  it.each([
    ['no code', { state: 'state' }],
    ['no state', { code: 'code' }],
    ['a state longer than any the api gives', { state: 's'.repeat(201), code: 'code' }],
    ['a code longer than any a provider gives', { state: 'state', code: 'c'.repeat(2_001) }],
  ])('answers 400 VALIDATION_FAILED for %s', async (_case, body) => {
    const response = await callApi(user, 'POST', '/mailboxes/connection/completion', body);

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe('VALIDATION_FAILED');
  });
});
