import type { Database } from '@mailbox/db';
import {
  passkeyCreationOptionsSchema,
  passkeyListSchema,
  passkeyRequestOptionsSchema,
} from '@mailbox/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { callAuth, errorCode, sessionSetCookie } from './auth-requests.ts';
import { type RunningApi, startApi } from './start-api.ts';
import { signInOnFreshInstance, TEST_PASSWORD } from './test-account.ts';
import { openTestDatabase } from './test-database.ts';

// The contract of the passkey routes while their answers are placeholders: inputs are checked, and
// every answer has the shape the web app expects.

const credentialId = 'Y3JlZGVudGlhbC1pZA';
const passkeyId = '0b9d5c3e-7a41-4f2e-9c1d-3e5f6a7b8c9d';
const assertion = {
  id: credentialId,
  rawId: credentialId,
  type: 'public-key',
  response: {
    clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0In0',
    authenticatorData: 'YXV0aGVudGljYXRvci1kYXRh',
    signature: 'c2lnbmF0dXJl',
    userHandle: 'dXNlci1oYW5kbGU',
  },
  clientExtensionResults: {},
};
const registration = {
  id: credentialId,
  rawId: credentialId,
  type: 'public-key',
  response: {
    clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIn0',
    attestationObject: 'YXR0ZXN0',
  },
  clientExtensionResults: {},
};

let api: RunningApi;
let database: Database;
let cookie: string;

beforeAll(async () => {
  api = await startApi();
  database = openTestDatabase();
  cookie = await signInOnFreshInstance(api, database);
});

afterAll(async () => {
  await api.close();
  await database.$client.end();
});

describe('passkey routes, signing in', () => {
  it('gives the options to sign in with a passkey of the host of the app', async () => {
    const response = await callAuth(api, 'POST', '/passkey-login/options');

    expect(response.status).toBe(200);
    expect(passkeyRequestOptionsSchema.parse(await response.json()).rpId).toBe('mail.example');
  });

  it('refuses a passkey it does not accept, without opening a session', async () => {
    const response = await callAuth(api, 'POST', '/passkey-login', {
      body: { response: assertion },
    });

    expect(response.status).toBe(401);
    expect(sessionSetCookie(response)).toBeUndefined();
    expect(await errorCode(response)).toBe('INVALID_PASSKEY');
  });

  it('refuses an answer that is not a passkey', async () => {
    const response = await callAuth(api, 'POST', '/passkey-login', {
      body: { response: { ...assertion, type: 'password' } },
    });

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe('VALIDATION_FAILED');
  });
});

describe('passkey routes, signed in', () => {
  it('lists the passkeys of the account', async () => {
    const response = await callAuth(api, 'GET', '/passkeys', { cookie });

    expect(response.status).toBe(200);
    expect(passkeyListSchema.safeParse(await response.json()).success).toBe(true);
  });

  it('gives the options to create a passkey for the host of the app', async () => {
    const response = await callAuth(api, 'POST', '/passkeys/options', { cookie });

    expect(response.status).toBe(200);
    expect(passkeyCreationOptionsSchema.parse(await response.json()).rp.id).toBe('mail.example');
  });

  it('adds a passkey with a name, and only with one', async () => {
    const named = await callAuth(api, 'POST', '/passkeys', {
      cookie,
      body: { name: 'iPhone', response: registration },
    });
    const unnamed = await callAuth(api, 'POST', '/passkeys', {
      cookie,
      body: { name: '  ', response: registration },
    });

    expect(named.status).toBe(204);
    expect(unnamed.status).toBe(400);
  });

  it('removes a passkey named by its id', async () => {
    const removal = await callAuth(api, 'DELETE', `/passkeys/${passkeyId}`, { cookie });
    const malformed = await callAuth(api, 'DELETE', '/passkeys/iphone', { cookie });

    expect(removal.status).toBe(204);
    expect(malformed.status).toBe(400);
    expect(await errorCode(malformed)).toBe('VALIDATION_FAILED');
  });
});

describe('passkey routes, identity confirmation', () => {
  it('gives the options to confirm the identity with a passkey', async () => {
    const response = await callAuth(api, 'POST', '/identity-confirmation/options', { cookie });

    expect(response.status).toBe(200);
    expect(passkeyRequestOptionsSchema.safeParse(await response.json()).success).toBe(true);
  });

  it('takes the password and a code, or a passkey, and nothing else', async () => {
    const withPassword = await callAuth(api, 'POST', '/identity-confirmation', {
      cookie,
      body: { method: 'password', password: TEST_PASSWORD, totpCode: '123456' },
    });
    const unknown = await callAuth(api, 'POST', '/identity-confirmation', {
      cookie,
      body: { method: 'email', address: 'alex@example.com' },
    });

    expect(withPassword.status).toBe(204);
    expect(unknown.status).toBe(400);
  });
});

describe('passkey routes, without a session', () => {
  it.each([
    ['GET', '/passkeys'],
    ['POST', '/passkeys/options'],
    ['DELETE', `/passkeys/${passkeyId}`],
    ['POST', '/identity-confirmation/options'],
  ])('refuses %s %s without a session', async (method, path) => {
    const response = await callAuth(api, method, path);

    expect(response.status).toBe(401);
    expect(await errorCode(response)).toBe('UNAUTHENTICATED');
  });
});
