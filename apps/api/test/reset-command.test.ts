import { account, authAttempt, type Database, recoveryCode, session, setupCode } from '@mailbox/db';
import { totpEnrollmentSchema } from '@mailbox/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { RESET_CONFIRMATION, runResetCommand } from '../src/auth/reset-command.ts';
import { callAuth } from './auth-requests.ts';
import { type RunningApi, startApi } from './start-api.ts';
import { signInOnFreshInstance } from './test-account.ts';
import { openTestDatabase } from './test-database.ts';

let api: RunningApi;
let database: Database;
let cookie: string;

function terminal(answer: string) {
  return { ask: vi.fn(async () => answer), print: vi.fn() };
}

async function rowCounts() {
  return {
    accounts: (await database.select().from(account)).length,
    sessions: (await database.select().from(session)).length,
    recoveryCodes: (await database.select().from(recoveryCode)).length,
  };
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

describe('resetting the access from the server', () => {
  it('erases the account and its sessions, then opens setup with the code it prints', async () => {
    await database.insert(authAttempt).values({ kind: 'password', client: '100.64.0.1' });
    const prompt = terminal(RESET_CONFIRMATION);

    expect(await runResetCommand(process.env, prompt)).toBe(true);

    expect(await rowCounts()).toEqual({ accounts: 0, sessions: 0, recoveryCodes: 0 });
    expect(await database.select().from(authAttempt)).toHaveLength(0);
    expect(await database.select().from(setupCode)).toHaveLength(1);
    expect((await callAuth(api, 'GET', '/status', { cookie })).status).toBe(200);
    expect((await fetch(`${api.url}/api/mailboxes`, { headers: { cookie } })).status).toBe(401);
    const printed = String(prompt.print.mock.calls.at(-1)?.[0]);
    const code = /setup code ([A-Z2-7-]{14})/.exec(printed)?.[1];
    const enrollment = await callAuth(api, 'POST', '/setup/totp-secret', {
      body: { setupCode: code, username: 'alex' },
    });
    expect(totpEnrollmentSchema.safeParse(await enrollment.json()).success).toBe(true);
  });

  it('changes nothing without the exact confirmation', async () => {
    const before = await rowCounts();
    const prompt = terminal('yes');

    expect(await runResetCommand(process.env, prompt)).toBe(true);

    expect(await rowCounts()).toEqual(before);
    expect(prompt.print).toHaveBeenCalledWith('Nothing was changed.\n');
  });

  it('refuses to run with an invalid configuration, before asking anything', async () => {
    const prompt = terminal(RESET_CONFIRMATION);

    expect(await runResetCommand({ DATABASE_URL: process.env.DATABASE_URL }, prompt)).toBe(false);

    expect(prompt.ask).not.toHaveBeenCalled();
    expect((await rowCounts()).accounts).toBe(1);
  });
});
