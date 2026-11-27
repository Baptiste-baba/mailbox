import type { Options } from 'pino-http';
import type { ApiConfig } from '../config/api-config.ts';
import { serializeHttpLoggerError } from './serialize-error.ts';

interface SerializedRequest {
  id: unknown;
  method: string;
  url: string;
}

interface SerializedResponse {
  statusCode: number;
}

export function createHttpLoggerOptions(level: ApiConfig['logLevel']): Options {
  return {
    level,
    // Request logs keep identifiers only: headers carry the session cookie, query strings carry search terms.
    serializers: {
      req: (request: SerializedRequest) => ({
        id: request.id,
        method: request.method,
        path: request.url.split('?')[0],
      }),
      res: (response: SerializedResponse) => ({ statusCode: response.statusCode }),
      err: serializeHttpLoggerError,
    },
    // Docker probes /health every few seconds; logging each probe would drown real traffic.
    autoLogging: { ignore: (request) => request.url === '/health' },
  };
}
