import { stdSerializers } from 'pino';
import { withoutQueryValues } from './without-query-values.ts';

/**
 * How a service logs an error: as pino does, without the values of a failed query, which may be
 * the content of a mail. The `err` serializer of every logger of the app.
 */
export function serializeError(error: unknown): unknown {
  const loggable = withoutQueryValues(error);
  return loggable instanceof Error ? stdSerializers.err(loggable) : loggable;
}
