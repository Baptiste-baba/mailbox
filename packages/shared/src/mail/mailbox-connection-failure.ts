import * as z from 'zod';
import { AppError } from '../errors/app-error.ts';

/**
 * Why a mailbox could not be connected:
 * - `connectionExpired`: the api was not, or no longer, waiting for this connection;
 * - `codeRefused`: the provider refused the code the user came back with;
 * - `clientRefused`: the provider does not accept the client this server is set up with;
 * - `accessNotGranted`: the provider granted less than a lasting read access to the mail;
 * - `apiDisabled`: the mail API is not enabled for the client this server is set up with;
 * - `accountUnreadable`: the provider would not tell which account signed in.
 */
export const mailboxConnectionFailureReasonSchema = z.enum([
  'connectionExpired',
  'codeRefused',
  'clientRefused',
  'accessNotGranted',
  'apiDisabled',
  'accountUnreadable',
]);

const PROVIDER_DETAIL_MAX_LENGTH = 300;

/** Details of MAILBOX_CONNECTION_FAILED: enough for whoever set the server up to find the cause. */
export const mailboxConnectionFailureDetailsSchema = z.object({
  reason: mailboxConnectionFailureReasonSchema,
  /** What the provider answered, in its own words: an error code, a status, a short sentence. */
  providerDetail: z.string().max(PROVIDER_DETAIL_MAX_LENGTH).optional(),
});

export type MailboxConnectionFailureReason = z.infer<typeof mailboxConnectionFailureReasonSchema>;
export type MailboxConnectionFailureDetails = z.infer<typeof mailboxConnectionFailureDetailsSchema>;

/**
 * The error of a mailbox that could not be connected.
 * @param message For developers and logs: never what a provider wrote in its own words.
 * @param providerDetail What the provider answered; cut to the length the contract allows.
 */
export function mailboxConnectionFailure(
  reason: MailboxConnectionFailureReason,
  message: string,
  providerDetail?: string,
): AppError {
  const details: MailboxConnectionFailureDetails =
    providerDetail === undefined
      ? { reason }
      : { reason, providerDetail: providerDetail.slice(0, PROVIDER_DETAIL_MAX_LENGTH) };
  return new AppError('MAILBOX_CONNECTION_FAILED', message, { details });
}
