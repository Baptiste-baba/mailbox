import { authStatusSchema } from '@mailbox/shared';
import { queryOptions } from '@tanstack/react-query';
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
