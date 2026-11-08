import {
  authStatusSchema,
  errorResponseSchema,
  loginResponseSchema,
  setupResponseSchema,
  totpEnrollmentSchema,
} from '@mailbox/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type RunningApi, startApi } from './start-api.ts';

let api: RunningApi;

beforeAll(async () => {
  api = await startApi();
});

afterAll(async () => {
  await api.close();
});

function send(method: string, path: string, body?: unknown): Promise<Response> {
  return fetch(`${api.url}/api/auth${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

async function errorCode(response: Response): Promise<string> {
  return errorResponseSchema.parse(await response.json()).code;
}

describe('authentication routes, sign-in', () => {
  it('reports the authentication status', async () => {
    const response = await fetch(`${api.url}/api/auth/status`);

    expect(response.status).toBe(200);
    expect(authStatusSchema.safeParse(await response.json()).success).toBe(true);
  });

  it('asks for the second factor, then answers the sign-in', async () => {
    const credentials = { username: 'alex', password: 'correct horse battery' };

    const withoutCode = await send('POST', '/login', credentials);
    expect(withoutCode.status).toBe(401);
    expect(await errorCode(withoutCode)).toBe('SECOND_FACTOR_REQUIRED');

    const withCode = await send('POST', '/login', {
      ...credentials,
      secondFactor: { kind: 'totp', code: '123456' },
    });
    expect(withCode.status).toBe(200);
    expect(loginResponseSchema.safeParse(await withCode.json()).success).toBe(true);
  });
});

describe('authentication routes, setup and second factor', () => {
  it('gives an authenticator secret, then creates the account with its recovery codes', async () => {
    const enrollment = await send('POST', '/setup/totp-secret', { setupCode: 'aaaa-aaaa-aaaa' });
    expect(enrollment.status).toBe(200);
    const { secret } = totpEnrollmentSchema.parse(await enrollment.json());

    const setup = await send('POST', '/setup', {
      setupCode: 'AAAA-AAAA-AAAA',
      username: 'alex',
      password: 'correct horse battery',
      totpSecret: secret,
      totpCode: '123456',
    });
    expect(setup.status).toBe(201);
    expect(setupResponseSchema.parse(await setup.json()).recoveryCodes).toHaveLength(10);
  });

  it('replaces the authenticator app and signs out', async () => {
    const enrollment = await send('POST', '/totp/secret');
    const { secret } = totpEnrollmentSchema.parse(await enrollment.json());

    expect((await send('PUT', '/totp', { totpSecret: secret, totpCode: '123456' })).status).toBe(
      204,
    );
    expect((await send('POST', '/logout')).status).toBe(204);
  });
});

describe('authentication routes, refused requests', () => {
  it.each([
    [
      'a password shorter than 12 characters at setup',
      '/setup',
      {
        setupCode: 'AAAA-AAAA-AAAA',
        username: 'alex',
        password: 'short',
        totpSecret: 'X',
        totpCode: '123456',
      },
    ],
    [
      'a code that is not 6 digits',
      '/login',
      { username: 'alex', password: 'x', secondFactor: { kind: 'totp', code: '12345' } },
    ],
    ['a setup code in the wrong format', '/setup/totp-secret', { setupCode: '1234' }],
    ['a body that is not JSON', '/login', '{"username": '],
  ])('answers 400 VALIDATION_FAILED for %s', async (_case, path, body) => {
    const response = await send('POST', path, body);

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe('VALIDATION_FAILED');
  });

  it('answers 413 PAYLOAD_TOO_LARGE for an oversized body', async () => {
    const response = await send('POST', '/login', {
      username: 'alex',
      password: 'x'.repeat(200_000),
    });

    expect(response.status).toBe(413);
    expect(await errorCode(response)).toBe('PAYLOAD_TOO_LARGE');
  });

  it('answers 401 INVALID_SETUP_CODE for a wrong setup code', async () => {
    const response = await send('POST', '/setup/totp-secret', { setupCode: 'ZZZZ-ZZZZ-ZZZZ' });

    expect(response.status).toBe(401);
    expect(await errorCode(response)).toBe('INVALID_SETUP_CODE');
  });
});
