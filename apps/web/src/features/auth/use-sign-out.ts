import { useMutation } from '@tanstack/react-query';
import { authErrorMessage } from './auth-error-message.ts';
import { logOut } from './login-requests.ts';
import { useContinueTo } from './use-continue-to.ts';

/** Signing out of this device, then off to sign-in; or why the server could not be told. */
export function useSignOut() {
  const continueTo = useContinueTo();
  const signOut = useMutation({
    mutationFn: logOut,
    // Given here rather than to mutate(): it runs even when the dialog was closed meanwhile.
    onSuccess: () => continueTo('/login'),
  });
  return {
    pending: signOut.isPending,
    error: signOut.error === null ? undefined : authErrorMessage(signOut.error),
    signOut: () => signOut.mutate(),
  };
}
