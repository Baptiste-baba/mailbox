import { errorResponseSchema } from '@mailbox/shared';
import type * as z from 'zod';
import { ApiError } from './api-error.ts';
import { ServerUnreachableError } from './server-unreachable-error.ts';

const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Gets `path` from the api and checks the answer against the contract.
 * @throws ApiError when the api answers with an error, ServerUnreachableError when it does not
 * answer.
 */
export async function fetchApi<Schema extends z.ZodType>(
  path: string,
  schema: Schema,
  signal?: AbortSignal,
): Promise<z.output<Schema>> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const response = await fetch(`/api${path}`, {
    headers: { accept: 'application/json' },
    signal: signal === undefined ? timeout : AbortSignal.any([signal, timeout]),
  }).catch((cause: unknown) => {
    // Cancelled by the caller: not a failure of the server.
    if (signal?.aborted === true) {
      throw cause;
    }
    throw new ServerUnreachableError(cause);
  });
  if (!response.ok) {
    // A proxy in front of the api may answer with a page of its own, not with the error format.
    const error = errorResponseSchema.safeParse(await response.json().catch(() => undefined));
    throw new ApiError(error.success ? error.data.code : 'INTERNAL_ERROR', response.status);
  }
  return schema.parse(await response.json());
}
