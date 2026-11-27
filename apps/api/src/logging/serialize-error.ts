import { serializeError } from '@mailbox/db';

/**
 * How the logger of pino-http logs an error: it hands its serializers the error already
 * serialized by pino, values included, and keeps the error itself under `raw`.
 */
export function serializeHttpLoggerError(serialized: unknown): unknown {
  const error = serialized instanceof Object && 'raw' in serialized ? serialized.raw : serialized;
  return serializeError(error);
}
