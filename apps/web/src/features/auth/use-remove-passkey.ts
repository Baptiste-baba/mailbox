import { useQueryClient } from '@tanstack/react-query';
import { passkeysQuery } from '../../api/passkeys-query.ts';
import { authErrorMessage } from './auth-error-message.ts';
import { removePasskey } from './passkey-requests.ts';
import { useIdentityGatedAction } from './use-identity-gated-action.ts';

/**
 * Removing a passkey, once the user said so: the identity is confirmed first when the api asks,
 * and the list goes without it once removed.
 */
export function useRemovePasskey(passkeyId: string, onRemoved: () => void) {
  const queryClient = useQueryClient();
  return useIdentityGatedAction({
    mutationFn: () => removePasskey(passkeyId),
    onSuccess: async () => {
      await queryClient.invalidateQueries(passkeysQuery);
      onRemoved();
    },
    errorMessage: authErrorMessage,
  });
}
