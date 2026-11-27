import { threadSchema } from '@mailbox/shared';
import { queryOptions } from '@tanstack/react-query';
import { fetchApi } from './fetch-api.ts';

/** Starts the key of every thread kept in the cache. */
export const THREAD_KEY = 'thread';

export function threadQuery(threadId: string) {
  return queryOptions({
    queryKey: [THREAD_KEY, threadId],
    queryFn: ({ signal }) =>
      fetchApi(`/threads/${encodeURIComponent(threadId)}`, threadSchema, signal),
  });
}
