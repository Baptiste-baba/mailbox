import type { ErrorCode } from '@mailbox/shared';

/** The api answered with one of the errors of its contract. */
export class ApiError extends Error {
  override readonly name = 'ApiError';
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, status: number) {
    super(`The api answered ${status} ${code}`);
    this.code = code;
    this.status = status;
  }
}
