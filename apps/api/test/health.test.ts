import { errorResponseSchema } from '@mailbox/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type RunningApi, startApi } from './start-api.js';

describe('GET /health', () => {
  describe('when the database is reachable', () => {
    let api: RunningApi;

    beforeAll(async () => {
      api = await startApi();
    });

    afterAll(async () => {
      await api.close();
    });

    it('answers ok', async () => {
      const response = await fetch(`${api.url}/health`);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ status: 'ok' });
    });
  });

  describe('when the database cannot be reached', () => {
    let api: RunningApi;

    beforeAll(async () => {
      // Port 1 is never a Postgres server: connections are refused immediately.
      api = await startApi({ DATABASE_URL: 'postgres://mailbox:mailbox@127.0.0.1:1/mailbox' });
    });

    afterAll(async () => {
      await api.close();
    });

    it('answers 503 with DATABASE_UNAVAILABLE', async () => {
      const response = await fetch(`${api.url}/health`);

      expect(response.status).toBe(503);
      expect(errorResponseSchema.parse(await response.json()).code).toBe('DATABASE_UNAVAILABLE');
    });
  });
});
