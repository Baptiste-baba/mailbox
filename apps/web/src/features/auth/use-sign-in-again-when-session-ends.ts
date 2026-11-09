import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { ApiError } from '../../api/api-error.ts';
import { authStatusQuery } from '../../api/auth-status-query.ts';

/**
 * Once the api refuses a request for want of a session (expired, or ended from another device),
 * asks to sign in again, then comes back to the same page.
 */
export function useSignInAgainWhenSessionEnds(): void {
  const queryClient = useQueryClient();
  const router = useRouter();
  useEffect(
    () =>
      queryClient.getQueryCache().subscribe((event) => {
        if (event.type !== 'updated' || event.action.type !== 'error') {
          return;
        }
        const { error } = event.action;
        if (!(error instanceof ApiError) || error.code !== 'UNAUTHENTICATED') {
          return;
        }
        // Asked again on the way: after a reset on the server, the answer is the setup, not sign-in.
        queryClient.removeQueries({ queryKey: authStatusQuery.queryKey });
        void router.navigate({
          to: '/login',
          search: { redirect: router.state.location.href, reason: 'expired' },
        });
      }),
    [queryClient, router],
  );
}
