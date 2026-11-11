import { withoutQueryValues } from '@mailbox/db';
import { stdSerializers } from 'pino';

/** How the api logs an error: as pino does, without the values of a failed query. */
export function serializeError(error: unknown): unknown {
  const loggable = withoutQueryValues(error);
  return loggable instanceof Error ? stdSerializers.err(loggable) : loggable;
}

/**
 * The same for the logger of pino-http, which hands its serializers the error already serialized
 * by pino, values included, and keeps the error itself under `raw`.
 */
export function serializeHttpLoggerError(serialized: unknown): unknown {
  const error = serialized instanceof Object && 'raw' in serialized ? serialized.raw : serialized;
  return serializeError(error);
}
