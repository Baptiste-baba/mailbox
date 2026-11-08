import type { Database } from '@mailbox/db';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { callAuth } from './auth-requests.ts';
import { totpCode } from './authenticator-app.ts';
import { type RunningApi, startApi } from './start-api.ts';
import {
  createTestAccount,
  TEST_PASSWORD,
  TEST_USERNAME,
  type TestAccount,
} from './test-account.ts';
import { openTestDatabase, resetAuthTables } from './test-database.ts';

const LAPTOP = '100.64.0.1';
const INTRUDER = '100.64.0.66';

let database: Database;
let behindProxy: RunningApi;
let direct: RunningApi;
let testAccount: TestAccount;

async function guessFrom(api: RunningApi, device: string) {
  for (let guess = 0; guess < 5; guess += 1) {
    await callAuth(api, 'POST', '/login', {
      body: { username: TEST_USERNAME, password: 'wrong password' },
      forwardedFor: device,
    });
  }
}

function logInFrom(api: RunningApi, device: string) {
  return callAuth(api, 'POST', '/login', {
    body: {
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
      secondFactor: { kind: 'totp', code: totpCode(testAccount.totpSecret, 1) },
    },
    forwardedFor: device,
  });
}

beforeAll(async () => {
  database = openTestDatabase();
  // The tests reach the api from this machine, as a local HTTPS endpoint would.
  behindProxy = await startApi({ TRUSTED_PROXIES: 'loopback' });
  direct = await startApi();
});

afterAll(async () => {
  await behindProxy.close();
  await direct.close();
  await database.$client.end();
});

beforeEach(async () => {
  await resetAuthTables(database);
  testAccount = await createTestAccount(behindProxy, database);
});

describe('failed sign-ins and devices', () => {
  it('slows down the device that guesses, never the others, behind a trusted proxy', async () => {
    await guessFrom(behindProxy, INTRUDER);

    expect((await logInFrom(behindProxy, INTRUDER)).status).toBe(429);
    expect((await logInFrom(behindProxy, LAPTOP)).status).toBe(200);
  });

  it('ignores the device a request claims when no proxy is trusted', async () => {
    await guessFrom(direct, INTRUDER);

    expect((await logInFrom(direct, LAPTOP)).status).toBe(429);
  });
});
