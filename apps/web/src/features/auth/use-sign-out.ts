import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { authErrorMessage } from './auth-error-message.ts';
import { logOut } from './login-requests.ts';
import { useContinueTo } from './use-continue-to.ts';

/** Signing out of this device, then off to sign-in; or why the server could not be told. */
export function useSignOut() {
  const continueTo = useContinueTo();
  const [error, setError] = useState<string>();
  const signOut = useMutation({ mutationFn: logOut });
  return {
    pending: signOut.isPending,
    error,
    signOut: () => {
      setError(undefined);
      signOut.mutate(undefined, {
        onSuccess: () => continueTo('/login'),
        onError: (failure) => setError(authErrorMessage(failure)),
      });
    },
  };
}
