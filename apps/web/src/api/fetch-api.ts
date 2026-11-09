import { errorResponseSchema } from '@mailbox/shared';
import type * as z from 'zod';
import { ApiError } from './api-error.ts';
import { ServerUnreachableError } from './server-unreachable-error.ts';

const REQUEST_TIMEOUT_MS = 15_000;

interface ApiRequest {
  method: 'GET' | 'POST';
  body?: unknown;
  signal?: AbortSignal | undefined;
}

async function requestApi<Schema extends z.ZodType>(
  path: string,
  schema: Schema,
  { method, body, signal }: ApiRequest,
): Promise<z.output<Schema>> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const headers = new Headers({ accept: 'application/json' });
  if (body !== undefined) {
    headers.set('content-type', 'application/json');
  }
  const response = await fetch(`/api${path}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
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
    throw error.success
      ? new ApiError(error.data.code, response.status, error.data.details)
      : new ApiError('INTERNAL_ERROR', response.status);
  }
  return schema.parse(await response.json());
}

/**
 * Gets `path` from the api and checks the answer against the contract.
 * @throws ApiError when the api answers with an error, ServerUnreachableError when it does not
 * answer.
 */
export function fetchApi<Schema extends z.ZodType>(
  path: string,
  schema: Schema,
  signal?: AbortSignal,
): Promise<z.output<Schema>> {
  return requestApi(path, schema, { method: 'GET', signal });
}

/**
 * Sends `body` to `path` as JSON, and checks the answer against the contract.
 * @throws ApiError when the api answers with an error, ServerUnreachableError when it does not
 * answer.
 */
export function postApi<Schema extends z.ZodType>(
  path: string,
  body: unknown,
  schema: Schema,
): Promise<z.output<Schema>> {
  return requestApi(path, schema, { method: 'POST', body });
}
