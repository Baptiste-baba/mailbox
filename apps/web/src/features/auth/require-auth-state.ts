import type { AuthStatus } from '@mailbox/shared';
import type { QueryClient } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';
import { authStatusQuery } from '../../api/auth-status-query.ts';

type AuthState = AuthStatus['state'];
type StatusIn<State extends AuthState> = Extract<AuthStatus, { state: State }>;

function isIn<State extends AuthState>(
  status: AuthStatus,
  state: State,
): status is StatusIn<State> {
  return status.state === state;
}

/** The one place that says where each state belongs, then back to `back` from there. */
function redirectFor(status: AuthStatus, back: string | undefined) {
  switch (status.state) {
    case 'setupRequired':
      return redirect({ to: '/setup' });
    case 'signedOut':
      return redirect({ to: '/login', search: { redirect: back } });
    case 'authenticatorReplacementRequired':
      return redirect({ to: '/new-authenticator', search: { redirect: back } });
    case 'signedIn':
      return redirect({ href: back ?? '/' });
  }
}

/**
 * For the `beforeLoad` of a page meant for one state of the authentication: gives the status when
 * it is that state, else sends where the actual state belongs.
 * @param back The page to come back to, once the other state is dealt with.
 */
export async function requireAuthState<State extends AuthState>(
  queryClient: QueryClient,
  state: State,
  back: string | undefined,
): Promise<StatusIn<State>> {
  const status = await queryClient.ensureQueryData(authStatusQuery);
  if (isIn(status, state)) {
    return status;
  }
  throw redirectFor(status, back);
}
