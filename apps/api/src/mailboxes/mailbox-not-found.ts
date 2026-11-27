import { AppError } from '@mailbox/shared';

export function mailboxNotFound(mailboxId: string): AppError {
  return new AppError('MAILBOX_NOT_FOUND', 'Mailbox not found', { details: { mailboxId } });
}
