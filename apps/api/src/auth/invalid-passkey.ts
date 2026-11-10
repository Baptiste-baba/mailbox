import { AppError } from '@mailbox/shared';

/** Whatever was wrong with a passkey, the client only learns that it was refused. */
export function invalidPasskey(cause?: unknown): AppError {
  return new AppError('INVALID_PASSKEY', 'This passkey is not accepted', { cause });
}
