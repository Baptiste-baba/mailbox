import type { ErrorCode } from './error-code.ts';

export interface AppErrorOptions {
  details?: unknown;
  cause?: unknown;
}

/** Expected failure with a stable code, safe to expose to clients. */
export class AppError extends Error {
  override readonly name = 'AppError';
  readonly code: ErrorCode;
  readonly details: unknown;

  constructor(code: ErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.code = code;
    this.details = options.details;
  }
}
