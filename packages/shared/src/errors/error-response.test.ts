import { describe, expect, it } from 'vitest';
import { errorResponseSchema } from './error-response.ts';

describe('errorResponseSchema', () => {
  it('accepts a response without details', () => {
    const result = errorResponseSchema.safeParse({
      code: 'ROUTE_NOT_FOUND',
      message: 'Cannot GET /unknown',
    });

    expect(result.success).toBe(true);
  });

  it('keeps details when present', () => {
    const details = { issues: [{ path: ['limit'], message: 'Too big' }] };

    const result = errorResponseSchema.parse({
      code: 'VALIDATION_FAILED',
      message: 'Invalid query',
      details,
    });

    expect(result.details).toEqual(details);
  });

  it('rejects a code that is not part of the contract', () => {
    const result = errorResponseSchema.safeParse({ code: 'TEAPOT', message: 'I am a teapot' });

    expect(result.success).toBe(false);
  });

  it('rejects a response without message', () => {
    const result = errorResponseSchema.safeParse({ code: 'INTERNAL_ERROR' });

    expect(result.success).toBe(false);
  });
});
