import { ApiError } from './api-error.ts';

const MAX_RETRIES = 2;

/** Retries what may succeed on a second try: a network failure or a server error, never a 4xx. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status < 500) {
    return false;
  }
  return failureCount < MAX_RETRIES;
}
