import { useQuery } from '@tanstack/react-query';
import { authErrorMessage } from './auth-error-message.ts';
import { startAuthenticatorReplacement } from './login-requests.ts';

/** A new secret for the authenticator app, asked once when the screen opens. */
export function useNewAuthenticatorSecret() {
  const enrollment = useQuery({
    queryKey: ['auth', 'authenticator-replacement'],
    queryFn: startAuthenticatorReplacement,
    staleTime: Number.POSITIVE_INFINITY,
    // A secret is never offered twice: leaving the screen forgets it.
    gcTime: 0,
  });
  return {
    enrollment: enrollment.data,
    loadError: enrollment.isError ? authErrorMessage(enrollment.error) : undefined,
    reload: () => enrollment.refetch(),
  };
}
