import { DrizzleQueryError } from 'drizzle-orm';

/**
 * The error as it may be logged. Drizzle writes the values of a failed query into its message,
 * its stack and a property, and those values may be the content of a mail: here they are dropped,
 * all along the chain of causes. The statement stays, it only holds placeholders.
 * An error that carries no failed query is returned as it is.
 */
export function withoutQueryValues(error: unknown): unknown {
  if (!(error instanceof Error)) {
    return error;
  }
  const cause = withoutQueryValues(error.cause);
  if (error instanceof DrizzleQueryError) {
    return failedQuery(error, cause);
  }
  return cause === error.cause ? error : copyWithCause(error, cause);
}

function failedQuery(error: DrizzleQueryError, cause: unknown): Error {
  const safeError = new Error(`Failed query: ${error.query}`, { cause });
  safeError.stack = `${safeError.name}: ${safeError.message}${stackFramesOf(error)}`;
  return safeError;
}

// A stack opens with the name and the message, values included. Past that exact opening, the
// frames are safe; when the opening is not the one expected, nothing of the stack is kept.
function stackFramesOf(error: Error): string {
  const opening = `${error.name}: ${error.message}`;
  const stack = error.stack ?? '';
  return stack.startsWith(opening) ? stack.slice(opening.length) : '';
}

// The error given to the logger is left untouched: whoever catches it next still sees its cause.
function copyWithCause(error: Error, cause: unknown): Error {
  return Object.create(Object.getPrototypeOf(error), {
    ...Object.getOwnPropertyDescriptors(error),
    // V8 reads a stack from the error it was captured on: copied as it is, the property would
    // find nothing on the copy. Its text is copied instead.
    stack: { value: error.stack, writable: true, configurable: true },
    cause: { value: cause, writable: true, configurable: true },
  });
}
