import { authStatusSchema } from '@mailbox/shared';
import { type QueryClient, queryOptions } from '@tanstack/react-query';
import { fetchApi } from './fetch-api.ts';

/**
 * Who uses the app: asked once, then kept until signing in, signing out, or a request the api
 * refuses for want of a session.
 */
export const authStatusQuery = queryOptions({
  queryKey: ['auth', 'status'],
  queryFn: ({ signal }) => fetchApi('/auth/status', authStatusSchema, signal),
  staleTime: Number.POSITIVE_INFINITY,
});

/** Forgets the status: the next page asks the server again, and goes where the answer leads. */
export function forgetAuthStatus(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: authStatusQuery.queryKey });
}
