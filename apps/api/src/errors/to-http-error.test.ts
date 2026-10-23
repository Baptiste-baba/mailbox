import { AppError } from '@mailbox/shared';
import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { toHttpError } from './to-http-error.ts';

describe('toHttpError', () => {
  it('exposes an expected error with its code, message and details', () => {
    const error = new AppError('VALIDATION_FAILED', 'Invalid query', {
      details: { field: 'limit' },
    });

    expect(toHttpError(error)).toEqual({
      status: 400,
      body: { code: 'VALIDATION_FAILED', message: 'Invalid query', details: { field: 'limit' } },
    });
  });

  it('reports an unmatched route as ROUTE_NOT_FOUND', () => {
    const httpError = toHttpError(new NotFoundException('Cannot GET /api/unknown'));

    expect(httpError).toEqual({
      status: 404,
      body: { code: 'ROUTE_NOT_FOUND', message: 'Cannot GET /api/unknown' },
    });
  });

  it('hides the message of an unexpected error', () => {
    const httpError = toHttpError(new Error('connection to 10.0.0.12 refused'));

    expect(httpError).toEqual({
      status: 500,
      body: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  });
});
