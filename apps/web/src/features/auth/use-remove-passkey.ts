import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { passkeysQuery } from '../../api/passkeys-query.ts';
import { authErrorMessage } from './auth-error-message.ts';
import { removePasskey } from './passkey-requests.ts';
import { useIdentityGate } from './use-identity-gate.ts';

/**
 * Removing a passkey, once the user said so: the identity is confirmed first when the api asks,
 * and the list goes without it once removed.
 */
export function useRemovePasskey(passkeyId: string, onRemoved: () => void) {
  const queryClient = useQueryClient();
  const gate = useIdentityGate();
  const [error, setError] = useState<string>();
  const remove = useMutation({ mutationFn: () => removePasskey(passkeyId) });
  const run = () => {
    setError(undefined);
    remove.mutate(undefined, {
      onSuccess: async () => {
        await queryClient.invalidateQueries(passkeysQuery);
        onRemoved();
      },
      onError: (failure) => {
        if (!gate.holds(failure, run)) {
          setError(authErrorMessage(failure));
        }
      },
    });
  };
  return { gate, error, pending: remove.isPending, remove: run };
}
