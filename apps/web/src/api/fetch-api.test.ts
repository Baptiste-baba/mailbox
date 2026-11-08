import { mailboxListSchema } from '@mailbox/shared';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { ApiError } from './api-error.ts';
import { fetchApi } from './fetch-api.ts';

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

  test('rejects an answer that breaks the contract', async () => {
    answer(200, { mailboxes: [{ id: 'mailbox-1' }] });

    await expect(fetchApi('/mailboxes', mailboxListSchema)).rejects.toThrow();
  });
});
