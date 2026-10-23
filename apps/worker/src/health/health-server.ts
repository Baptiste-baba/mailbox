import { once } from 'node:events';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { ErrorResponse } from '@mailbox/shared';

// Only Docker's health probe calls it, from inside the container: it never listens beyond loopback.
const LOOPBACK = '127.0.0.1';

/** Resolves to whether the worker can do its job. Must never reject. */
export type HealthCheck = () => Promise<boolean>;

export interface HealthServer {
  port: number;
  close: () => Promise<void>;
}

export async function startHealthServer(
  port: number,
  isHealthy: HealthCheck,
): Promise<HealthServer> {
  const server = createServer((request, response) => {
    void answer(request, response, isHealthy);
  });
  server.listen(port, LOOPBACK);
  await once(server, 'listening');
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Health server is not bound to a TCP port');
  }
  return {
    port: address.port,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

async function answer(
  request: IncomingMessage,
  response: ServerResponse,
  isHealthy: HealthCheck,
): Promise<void> {
  if (request.method !== 'GET' || request.url !== '/health') {
    const notFound: ErrorResponse = {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${request.method} ${request.url}`,
    };
    sendJson(response, 404, notFound);
    return;
  }
  if (await isHealthy()) {
    sendJson(response, 200, { status: 'ok' });
    return;
  }
  const unavailable: ErrorResponse = {
    code: 'DATABASE_UNAVAILABLE',
    message: 'Database is unreachable',
  };
  sendJson(response, 503, unavailable);
}

function sendJson(response: ServerResponse, status: number, body: object): void {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}
