import { mailboxListSchema, setupResponseSchema } from '@mailbox/shared';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { ApiError } from './api-error.ts';
import { fetchApi, postApi } from './fetch-api.ts';
import { ServerUnreachableError } from './server-unreachable-error.ts';

function answer(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json(body, { status })),
  );
}

describe('fetchApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('gives the answer once it follows the contract', async () => {
    answer(200, { mailboxes: [] });

    await expect(fetchApi('/mailboxes', mailboxListSchema)).resolves.toEqual({ mailboxes: [] });
  });

  test('turns an error of the contract into an ApiError with its code', async () => {
    answer(404, { code: 'THREAD_NOT_FOUND', message: 'Thread not found' });

    await expect(fetchApi('/threads/thread-0', mailboxListSchema)).rejects.toEqual(
      new ApiError('THREAD_NOT_FOUND', 404),
    );
  });

  test('keeps the details the contract adds to an error', async () => {
    answer(429, {
      code: 'TOO_MANY_ATTEMPTS',
      message: 'Too many failed attempts',
      details: { retryAfterSeconds: 42 },
    });

    await expect(fetchApi('/auth/status', mailboxListSchema)).rejects.toMatchObject({
      code: 'TOO_MANY_ATTEMPTS',
      details: { retryAfterSeconds: 42 },
    });
  });

  test('tells a server that does not answer apart from an error it answers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );

    await expect(fetchApi('/mailboxes', mailboxListSchema)).rejects.toBeInstanceOf(
      ServerUnreachableError,
    );
  });

  test('rejects an answer that breaks the contract', async () => {
    answer(200, { mailboxes: [{ id: 'mailbox-1' }] });

    await expect(fetchApi('/mailboxes', mailboxListSchema)).rejects.toThrow();
  });
});

describe('postApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('sends its body as JSON, and gives the answer once it follows the contract', async () => {
    const answered = { recoveryCodes: Array.from({ length: 10 }, () => 'ABCD-EFGH-JKLM') };
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      Response.json(answered, { status: 201 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      postApi('/auth/setup', { username: 'alex' }, setupResponseSchema),
    ).resolves.toEqual(answered);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('/api/auth/setup');
    expect(init).toMatchObject({ method: 'POST', body: '{"username":"alex"}' });
  });
});
