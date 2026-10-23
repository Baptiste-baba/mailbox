import { errorResponseSchema } from '@mailbox/shared';
import { afterEach, describe, expect, it } from 'vitest';
import { type HealthServer, startHealthServer } from './health-server.ts';

describe('health server', () => {
  let server: HealthServer | undefined;

  afterEach(async () => {
    await server?.close();
  });

  async function request(isHealthy: boolean, path = '/health'): Promise<Response> {
    server = await startHealthServer(0, async () => isHealthy);
    return fetch(`http://127.0.0.1:${server.port}${path}`);
  }

  it('answers ok when the worker is healthy', async () => {
    const response = await request(true);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('answers 503 with DATABASE_UNAVAILABLE when the worker is unhealthy', async () => {
    const response = await request(false);

    expect(response.status).toBe(503);
    expect(errorResponseSchema.parse(await response.json()).code).toBe('DATABASE_UNAVAILABLE');
  });

  it('answers 404 on any other path', async () => {
    const response = await request(true, '/metrics');

    expect(response.status).toBe(404);
    expect(errorResponseSchema.parse(await response.json()).code).toBe('ROUTE_NOT_FOUND');
  });
});
