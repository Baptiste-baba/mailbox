import { describe, expect, test } from 'vitest';
import { ApiError } from './api-error.ts';
import { shouldRetry } from './should-retry.ts';

describe('shouldRetry', () => {
  test('retries a network failure or a server error, twice at most', () => {
    expect(shouldRetry(0, new TypeError('Failed to fetch'))).toBe(true);
    expect(shouldRetry(1, new ApiError('DATABASE_UNAVAILABLE', 503))).toBe(true);
    expect(shouldRetry(2, new ApiError('DATABASE_UNAVAILABLE', 503))).toBe(false);
  });

  test('never retries a request the api refused', () => {
    expect(shouldRetry(0, new ApiError('THREAD_NOT_FOUND', 404))).toBe(false);
    expect(shouldRetry(0, new ApiError('VALIDATION_FAILED', 400))).toBe(false);
  });
});
