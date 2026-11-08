import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { callAuth, errorCode } from './auth-requests.ts';
import { type RunningApi, startApi } from './start-api.ts';

let api: RunningApi;

beforeAll(async () => {
  api = await startApi();
});

afterAll(async () => {
  await api.close();
});

// Refused before any logic runs: these touch no row of the database.
describe('authentication routes, refused requests', () => {
  it.each([
    [
      'a password shorter than 12 characters at setup',
      '/setup',
      {
        setupCode: 'AAAA-AAAA-AAAA',
        username: 'alex',
        password: 'short',
        totpSecret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
        totpCode: '123456',
      },
    ],
    [
      'a code that is not 6 digits',
      '/login',
      { username: 'alex', password: 'x', secondFactor: { kind: 'totp', code: '12345' } },
    ],
    [
      'a setup code in the wrong format',
      '/setup/totp-secret',
      { setupCode: '1234', username: 'alex' },
    ],
    ['a body that is not JSON', '/login', '{"username": '],
  ])('answers 400 VALIDATION_FAILED for %s', async (_case, path, body) => {
    const response = await callAuth(api, 'POST', path, { body });

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe('VALIDATION_FAILED');
  });

  it('answers 413 PAYLOAD_TOO_LARGE for an oversized body', async () => {
    const response = await callAuth(api, 'POST', '/login', {
      body: { username: 'alex', password: 'x'.repeat(200_000) },
    });

    expect(response.status).toBe(413);
    expect(await errorCode(response)).toBe('PAYLOAD_TOO_LARGE');
  });
});
