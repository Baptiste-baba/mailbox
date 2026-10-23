import { errorResponseSchema } from '@mailbox/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type RunningApi, startApi } from './start-api.js';

describe('an unknown route', () => {
  let api: RunningApi;

  beforeAll(async () => {
    api = await startApi();
  });

  afterAll(async () => {
    await api.close();
  });

  it('answers 404 in the shared error format', async () => {
    const response = await fetch(`${api.url}/api/does-not-exist`);

    expect(response.status).toBe(404);
    expect(errorResponseSchema.parse(await response.json()).code).toBe('ROUTE_NOT_FOUND');
  });
});
