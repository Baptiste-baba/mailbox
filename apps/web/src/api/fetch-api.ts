import { errorResponseSchema } from '@mailbox/shared';
import type * as z from 'zod';
import { ApiError } from './api-error.ts';
import { ServerUnreachableError } from './server-unreachable-error.ts';

const REQUEST_TIMEOUT_MS = 15_000;

interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT';
  body?: unknown;
  signal?: AbortSignal | undefined;
}

async function requestApi(path: string, { method, body, signal }: ApiRequest): Promise<Response> {
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
  return response;
}

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
  const response = await requestApi(path, { method: 'GET', signal });
  return schema.parse(await response.json());
}

/**
 * Sends `body` to `path` as JSON, and checks the answer against the contract.
 * @throws ApiError when the api answers with an error, ServerUnreachableError when it does not
 * answer.
 */
export async function postApi<Schema extends z.ZodType>(
  path: string,
  body: unknown,
  schema: Schema,
): Promise<z.output<Schema>> {
  const response = await requestApi(path, { method: 'POST', body });
  return schema.parse(await response.json());
}

/**
 * Sends `body` to `path` as JSON, to replace what is there; the api answers with no content.
 * @throws ApiError when the api answers with an error, ServerUnreachableError when it does not
 * answer.
 */
export async function putApi(path: string, body: unknown): Promise<void> {
  await requestApi(path, { method: 'PUT', body });
}
