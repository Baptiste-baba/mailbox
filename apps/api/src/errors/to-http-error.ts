import { AppError, type ErrorCode, type ErrorResponse } from '@mailbox/shared';
import { HttpStatus, NotFoundException } from '@nestjs/common';

const httpStatusByErrorCode: Record<ErrorCode, HttpStatus> = {
  VALIDATION_FAILED: HttpStatus.BAD_REQUEST,
  ROUTE_NOT_FOUND: HttpStatus.NOT_FOUND,
  DATABASE_UNAVAILABLE: HttpStatus.SERVICE_UNAVAILABLE,
  INTERNAL_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
};

export interface HttpError {
  status: HttpStatus;
  body: ErrorResponse;
}

export function toHttpError(exception: unknown): HttpError {
  if (exception instanceof AppError) {
    return httpError(exception.code, exception.message, exception.details);
  }
  // Nest's router raises this for any request that matches no route.
  if (exception instanceof NotFoundException) {
    return httpError('ROUTE_NOT_FOUND', exception.message);
  }
  // Anything else is a bug: its message may expose internals, so the client only gets a generic one.
  return httpError('INTERNAL_ERROR', 'Internal server error');
}

function httpError(code: ErrorCode, message: string, details?: unknown): HttpError {
  return {
    status: httpStatusByErrorCode[code],
    body: details === undefined ? { code, message } : { code, message, details },
  };
}
