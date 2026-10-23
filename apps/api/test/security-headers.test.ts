import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type RunningApi, startApi } from './start-api.ts';

describe('security headers', () => {
  let api: RunningApi;

  beforeAll(async () => {
    api = await startApi();
  });

  afterAll(async () => {
    await api.close();
  });

  it('restricts every response to the app itself', async () => {
    const response = await fetch(`${api.url}/health`);

    expect(response.headers.get('content-security-policy')).toBe(
      "default-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    );
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('does not reveal the server technology', async () => {
    const response = await fetch(`${api.url}/health`);

    expect(response.headers.get('x-powered-by')).toBeNull();
  });

  it('applies to error responses too', async () => {
    const response = await fetch(`${api.url}/api/does-not-exist`);

    expect(response.headers.get('content-security-policy')).not.toBeNull();
  });
});
