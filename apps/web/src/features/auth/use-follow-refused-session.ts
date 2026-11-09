import type { ErrorCode } from '@mailbox/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { ApiError } from '../../api/api-error.ts';
import { forgetAuthStatus } from '../../api/auth-status-query.ts';

/** The api refusing the session itself, whatever the request. */
const SESSION_REFUSALS = new Set<ErrorCode>([
  'UNAUTHENTICATED',
  'AUTHENTICATOR_REPLACEMENT_REQUIRED',
]);

/**
 * Once the api refuses the session, to a query or to an action, asks the status again and goes
 * where it leads, then back to the same page: sign-in when the session ended, setup after a reset,
 * the new authenticator app after a recovery code.
 */
export function useFollowRefusedSession(): void {
  const queryClient = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    const follow = (error: unknown) => {
      if (!(error instanceof ApiError) || !SESSION_REFUSALS.has(error.code)) {
        return;
      }
      forgetAuthStatus(queryClient);
      const redirect = router.state.location.href;
      // Sign-in sends on to setup or to the new authenticator app when that is what the status says.
      void router.navigate({
        to: '/login',
        search: error.code === 'UNAUTHENTICATED' ? { redirect, reason: 'expired' } : { redirect },
      });
    };
    const unsubscribeFromQueries = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'error') {
        follow(event.action.error);
      }
    });
    const unsubscribeFromActions = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'error') {
        follow(event.action.error);
      }
    });
    return () => {
      unsubscribeFromQueries();
      unsubscribeFromActions();
    };
  }, [queryClient, router]);
}
