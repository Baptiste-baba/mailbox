import { AppError, type ErrorCode, type ErrorResponse } from '@mailbox/shared';
import { HttpException, HttpStatus } from '@nestjs/common';

const httpStatusByErrorCode: Record<ErrorCode, HttpStatus> = {
  VALIDATION_FAILED: HttpStatus.BAD_REQUEST,
  PAYLOAD_TOO_LARGE: HttpStatus.PAYLOAD_TOO_LARGE,
  UNAUTHENTICATED: HttpStatus.UNAUTHORIZED,
  INVALID_CREDENTIALS: HttpStatus.UNAUTHORIZED,
  SECOND_FACTOR_REQUIRED: HttpStatus.UNAUTHORIZED,
  INVALID_SECOND_FACTOR: HttpStatus.UNAUTHORIZED,
  TOO_MANY_ATTEMPTS: HttpStatus.TOO_MANY_REQUESTS,
  SETUP_NOT_AVAILABLE: HttpStatus.CONFLICT,
  SETUP_REQUIRED: HttpStatus.CONFLICT,
  INVALID_SETUP_CODE: HttpStatus.UNAUTHORIZED,
  CROSS_SITE_REQUEST: HttpStatus.FORBIDDEN,
  AUTHENTICATOR_REPLACEMENT_REQUIRED: HttpStatus.FORBIDDEN,
  AUTHENTICATOR_REPLACEMENT_NOT_REQUIRED: HttpStatus.FORBIDDEN,
  INVALID_PASSKEY: HttpStatus.UNAUTHORIZED,
  IDENTITY_CONFIRMATION_REQUIRED: HttpStatus.FORBIDDEN,
  ROUTE_NOT_FOUND: HttpStatus.NOT_FOUND,
  THREAD_NOT_FOUND: HttpStatus.NOT_FOUND,
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
  const rejectedRequest =
    exception instanceof HttpException ? frameworkError(exception) : undefined;
  // Anything else is a bug: its message may expose internals, so the client only gets a generic one.
  return rejectedRequest ?? httpError('INTERNAL_ERROR', 'Internal server error');
}

// The api itself only raises AppError: Nest raises these before any handler runs, when no route
// matches or when Express refuses the body. A JSON parse message may quote the body: never echoed.
function frameworkError(exception: HttpException): HttpError | undefined {
  switch (exception.getStatus()) {
    case HttpStatus.NOT_FOUND:
      return httpError('ROUTE_NOT_FOUND', exception.message);
    case HttpStatus.BAD_REQUEST:
      return httpError('VALIDATION_FAILED', 'Malformed request');
    case HttpStatus.PAYLOAD_TOO_LARGE:
      return httpError('PAYLOAD_TOO_LARGE', 'Request body too large');
    default:
      return undefined;
  }
}

function httpError(code: ErrorCode, message: string, details?: unknown): HttpError {
  return {
    status: httpStatusByErrorCode[code],
    body: details === undefined ? { code, message } : { code, message, details },
  };
}
