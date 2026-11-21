import type { Database } from '@mailbox/db';
import { mailProviderListSchema } from '@mailbox/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { errorCode } from './auth-requests.ts';
import { type ApiCaller, callApi, NEW_MAILBOX } from './mailbox-requests.ts';
import { type RunningApi, startApi } from './start-api.ts';
import { signInOnFreshInstance } from './test-account.ts';
import { openTestDatabase } from './test-database.ts';

let api: RunningApi;
let database: Database;
let user: ApiCaller;

beforeAll(async () => {
  api = await startApi();
  database = openTestDatabase();
  user = { api, cookie: await signInOnFreshInstance(api, database) };
});

afterAll(async () => {
  await api.close();
  await database.$client.end();
});

describe('a server set up without a Google client', () => {
  it('lists no provider to add a mailbox from', async () => {
    const response = await callApi(user, 'GET', '/mail-providers');

    expect(mailProviderListSchema.parse(await response.json()).providers).toEqual([]);
  });

  it('answers 409 MAIL_PROVIDER_NOT_CONFIGURED to adding a Gmail mailbox', async () => {
    const response = await callApi(user, 'POST', '/mailboxes/connection', NEW_MAILBOX);

    expect(response.status).toBe(409);
    expect(await errorCode(response)).toBe('MAIL_PROVIDER_NOT_CONFIGURED');
  });
});
