import { account, type Database, recoveryCode, setupCode } from '@mailbox/db';
import {
  authStatusSchema,
  errorResponseSchema,
  setupResponseSchema,
  totpEnrollmentSchema,
} from '@mailbox/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SetupService } from '../src/auth/setup.service.ts';
import { currentTotpCode } from './authenticator-app.ts';
import { type RunningApi, startApi } from './start-api.ts';
import { insertSetupCode, openTestDatabase, resetAuthTables } from './test-database.ts';

const SETUP_CODE = 'K7QD-M2XA-PT4R';
const PASSWORD = 'correct horse battery staple';

let api: RunningApi;
let database: Database;

function post(path: string, body: unknown): Promise<Response> {
  return fetch(`${api.url}/api/auth${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function errorCode(response: Response): Promise<string> {
  return errorResponseSchema.parse(await response.json()).code;
}

async function startEnrollment(setupCodeTyped = SETUP_CODE) {
  const response = await post('/setup/totp-secret', {
    setupCode: setupCodeTyped,
    username: 'alex',
  });
  return totpEnrollmentSchema.parse(await response.json());
}

async function createAccount(secret: string, totpCode = currentTotpCode(secret)) {
  return post('/setup', {
    setupCode: SETUP_CODE,
    username: 'alex',
    password: PASSWORD,
    totpSecret: secret,
    totpCode,
  });
}

beforeAll(async () => {
  database = openTestDatabase();
  api = await startApi();
});

afterAll(async () => {
  await api.close();
  await database.$client.end();
});

beforeEach(async () => {
  await resetAuthTables(database);
  await insertSetupCode(database, SETUP_CODE, new Date(Date.now() + 60 * 60 * 1_000));
});

describe('setup status', () => {
  it('asks for the setup while no account exists, with a setup code valid for an hour', async () => {
    await resetAuthTables(database);

    const response = await fetch(`${api.url}/api/auth/status`);

    expect(authStatusSchema.parse(await response.json())).toEqual({ state: 'setupRequired' });
    const codes = await database.select().from(setupCode);
    expect(codes).toHaveLength(1);
    expect(codes[0]?.expiresAt.getTime()).toBeCloseTo(Date.now() + 60 * 60 * 1_000, -4);
  });

  it('keeps a valid setup code, and replaces an expired one', async () => {
    await fetch(`${api.url}/api/auth/status`);
    expect(await database.select().from(setupCode)).toHaveLength(1);

    await database.update(setupCode).set({ expiresAt: new Date(Date.now() - 1_000) });
    await fetch(`${api.url}/api/auth/status`);

    const codes = await database.select().from(setupCode);
    expect(codes).toHaveLength(1);
    expect(codes[0]?.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  // The earlier codes can no longer be read back, and the logs of this start would show none.
  it('replaces the setup codes still valid when the api starts', async () => {
    await api.get(SetupService).issueNewCode();

    expect(await database.select().from(setupCode)).toHaveLength(1);
    const response = await post('/setup/totp-secret', { setupCode: SETUP_CODE, username: 'alex' });
    expect(await errorCode(response)).toBe('INVALID_SETUP_CODE');
  });
});

describe('setup', () => {
  it('gives a secret for the authenticator app, named after the user', async () => {
    const enrollment = await startEnrollment(SETUP_CODE.toLowerCase());

    expect(enrollment.otpauthUri).toBe(
      `otpauth://totp/MailBox:alex?secret=${enrollment.secret}&issuer=MailBox`,
    );
  });

  it('creates the account and gives ten distinct recovery codes, keeping no secret in clear', async () => {
    const { secret } = await startEnrollment();

    const response = await createAccount(secret);

    expect(response.status).toBe(201);
    const { recoveryCodes } = setupResponseSchema.parse(await response.json());
    expect(new Set(recoveryCodes).size).toBe(10);
    const [created] = await database.select().from(account);
    expect(created).toMatchObject({
      username: 'alex',
      passwordHash: expect.stringMatching(/^\$argon2id\$/),
    });
    expect(created?.totpSecretEncrypted).not.toContain(secret);
    const storedCodes = await database.select().from(recoveryCode);
    expect(storedCodes.map((code) => code.codeHash)).not.toContain(recoveryCodes[0]);
    expect(storedCodes).toHaveLength(10);
    expect(await database.select().from(setupCode)).toHaveLength(0);
  });

  it('closes the setup once the account exists', async () => {
    const { secret } = await startEnrollment();
    await createAccount(secret);

    const status = await fetch(`${api.url}/api/auth/status`);
    expect(authStatusSchema.parse(await status.json())).toEqual({ state: 'signedOut' });
    const again = await post('/setup/totp-secret', { setupCode: SETUP_CODE, username: 'alex' });
    expect(again.status).toBe(409);
    expect(await errorCode(again)).toBe('SETUP_NOT_AVAILABLE');
  });
});

describe('concurrent setups', () => {
  it('creates a single account when two setups race', async () => {
    const { secret } = await startEnrollment();

    const responses = await Promise.all([createAccount(secret), createAccount(secret)]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(await database.select().from(account)).toHaveLength(1);
  });
});

describe('refused setups', () => {
  it.each([
    ['an unknown setup code', 'ZZZZ-ZZZZ-ZZZZ', new Date(Date.now() + 60_000)],
    ['an expired setup code', 'ABCD-EFGH-IJKL', new Date(Date.now() - 60_000)],
  ])('answers 401 INVALID_SETUP_CODE for %s', async (_case, code, expiresAt) => {
    await insertSetupCode(database, 'ABCD-EFGH-IJKL', expiresAt);

    const response = await post('/setup/totp-secret', { setupCode: code, username: 'alex' });

    expect(response.status).toBe(401);
    expect(await errorCode(response)).toBe('INVALID_SETUP_CODE');
  });

  it('answers 401 INVALID_SECOND_FACTOR when the code is not the app’s, and creates nothing', async () => {
    const { secret } = await startEnrollment();
    const wrongCode = currentTotpCode(secret) === '000000' ? '111111' : '000000';

    const response = await createAccount(secret, wrongCode);

    expect(response.status).toBe(401);
    expect(await errorCode(response)).toBe('INVALID_SECOND_FACTOR');
    expect(await database.select().from(account)).toHaveLength(0);
  });

  it('makes whoever guesses setup codes wait, even once they find the right one', async () => {
    for (let guess = 0; guess < 5; guess += 1) {
      await post('/setup/totp-secret', { setupCode: 'ZZZZ-ZZZZ-ZZZZ', username: 'alex' });
    }

    const response = await post('/setup/totp-secret', { setupCode: SETUP_CODE, username: 'alex' });

    expect(response.status).toBe(429);
    expect(errorResponseSchema.parse(await response.json())).toMatchObject({
      code: 'TOO_MANY_ATTEMPTS',
      details: { retryAfterSeconds: 1 },
    });
  });
});
