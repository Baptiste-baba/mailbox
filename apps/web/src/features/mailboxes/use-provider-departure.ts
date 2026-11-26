import type { MailboxAuthorization } from '@mailbox/shared';
import { useState } from 'react';
import { apiErrorMessage } from '../../api/api-error-message.ts';
import { fr } from '../../i18n/fr.ts';
import { useIdentityGatedAction } from '../auth/index.ts';

/**
 * Leaving for the provider to sign in there: the api says where, once the identity is confirmed
 * when it asks, and the provider brings the user back afterwards.
 * @param askWhere Starts the connection with the api, which answers where to sign in.
 */
export function useProviderDeparture<Request = void>(
  askWhere: (request: Request) => Promise<MailboxAuthorization>,
) {
  const [leaving, setLeaving] = useState(false);
  const departure = useIdentityGatedAction({
    mutationFn: async (request: Request) => {
      const { authorizationUrl } = await askWhere(request);
      window.location.assign(authorizationUrl);
    },
    // The page is on its way out: what shows stays as it is until the provider does.
    onSuccess: () => setLeaving(true),
    errorMessage: (failure) =>
      apiErrorMessage(failure, {
        MAIL_PROVIDER_NOT_CONFIGURED: fr.mailboxes.notConfigured,
        MAILBOX_NOT_FOUND: fr.mailboxes.removedMeanwhile,
      }),
  });
  return { ...departure, pending: departure.pending || leaving };
}
