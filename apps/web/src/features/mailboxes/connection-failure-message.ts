import { mailboxConnectionFailureDetailsSchema } from '@mailbox/shared';
import { ApiError } from '../../api/api-error.ts';
import { apiErrorMessage } from '../../api/api-error-message.ts';
import { fr } from '../../i18n/fr.ts';

/** The provider's own word for a user who did not grant the access. */
const ACCESS_DENIED = 'access_denied';

export interface ConnectionFailureMessage {
  /** What happened and what to do about it. */
  message: string;
  /** What the provider answered, for whoever set the server up. */
  providerDetail?: string | undefined;
}

/** What to tell the user when the provider sent them back without a code. */
export function providerRefusalMessage(providerError: string): ConnectionFailureMessage {
  return providerError === ACCESS_DENIED
    ? { message: fr.mailboxes.refusedByUser }
    : { message: fr.mailboxes.failures.codeRefused, providerDetail: providerError };
}

/** What to tell the user when the api could not finish a connection. */
export function connectionFailureMessage(error: unknown): ConnectionFailureMessage {
  const details =
    error instanceof ApiError && error.code === 'MAILBOX_CONNECTION_FAILED'
      ? mailboxConnectionFailureDetailsSchema.safeParse(error.details)
      : undefined;
  if (details?.success === true) {
    return {
      message: fr.mailboxes.failures[details.data.reason],
      providerDetail: details.data.providerDetail,
    };
  }
  return {
    message: apiErrorMessage(error, {
      MAILBOX_CONNECTION_FAILED: fr.mailboxes.failures.codeRefused,
      MAIL_PROVIDER_UNAVAILABLE: fr.mailboxes.providerUnavailable,
      MAIL_PROVIDER_NOT_CONFIGURED: fr.mailboxes.notConfigured,
    }),
  };
}
