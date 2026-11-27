import { useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '../../api/api-error-message.ts';
import { mailboxesQuery } from '../../api/mailboxes-query.ts';
import { THREAD_PAGES_KEY } from '../../api/thread-pages-query.ts';
import { THREAD_KEY } from '../../api/thread-query.ts';
import { fr } from '../../i18n/fr.ts';
import { useIdentityGatedAction } from '../auth/index.ts';
import { removeMailbox } from './mailbox-requests.ts';

/**
 * Removing a mailbox, once the user said so: the identity is confirmed first when the api asks,
 * and the list goes without it once removed.
 */
export function useRemoveMailbox(mailboxId: string, onRemoved: () => void) {
  const queryClient = useQueryClient();
  return useIdentityGatedAction({
    mutationFn: () => removeMailbox(mailboxId),
    onSuccess: async () => {
      // Its mail went with it: no list and no thread read earlier may show it again.
      queryClient.removeQueries({ queryKey: [THREAD_PAGES_KEY] });
      queryClient.removeQueries({ queryKey: [THREAD_KEY] });
      await queryClient.invalidateQueries(mailboxesQuery);
      onRemoved();
    },
    errorMessage: (failure) =>
      apiErrorMessage(failure, {
        MAIL_PROVIDER_UNAVAILABLE: fr.mailboxes.removeProviderUnavailable,
        MAIL_PROVIDER_NOT_CONFIGURED: fr.mailboxes.notConfigured,
      }),
  });
}
