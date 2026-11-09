import type { ErrorCode } from '@mailbox/shared';

/** The api answered with one of the errors of its contract. */
export class ApiError extends Error {
  override readonly name = 'ApiError';
  readonly code: ErrorCode;
  readonly status: number;
  /** What the contract adds to some errors, such as the wait after too many attempts. */
  readonly details: unknown;

  constructor(code: ErrorCode, status: number, details?: unknown) {
    super(`The api answered ${status} ${code}`);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
