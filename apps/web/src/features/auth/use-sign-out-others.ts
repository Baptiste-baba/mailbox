import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { authErrorMessage } from './auth-error-message.ts';
import { logOutOthers } from './login-requests.ts';
import { useIdentityGate } from './use-identity-gate.ts';

/**
 * Signing out every other device: the identity is confirmed first when the api asks; or why the
 * server could not be told.
 */
export function useSignOutOthers(onSignedOut: () => void) {
  const gate = useIdentityGate();
  const [error, setError] = useState<string>();
  const signOut = useMutation({ mutationFn: logOutOthers });
  const run = () => {
    setError(undefined);
    signOut.mutate(undefined, {
      onSuccess: onSignedOut,
      onError: (failure) => {
        if (!gate.holds(failure, run)) {
          setError(authErrorMessage(failure));
        }
      },
    });
  };
  return { gate, pending: signOut.isPending, error, signOut: run };
}
