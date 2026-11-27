import type { LogLevel } from '@mailbox/config';
import { serializeError } from '@mailbox/db';
import { type DestinationStream, type Logger, pino } from 'pino';

/**
 * The logger of the worker. The worker writes mail into the database: an error of a failed query
 * would carry that mail, and is logged without its values.
 * @param destination Where the lines go; standard output when none is given.
 */
export function createWorkerLogger(level: LogLevel, destination?: DestinationStream): Logger {
  const options = { level, serializers: { err: serializeError } };
  return destination === undefined ? pino(options) : pino(options, destination);
}
