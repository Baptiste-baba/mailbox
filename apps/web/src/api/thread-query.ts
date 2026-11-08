import { threadSchema } from '@mailbox/shared';
import { queryOptions } from '@tanstack/react-query';
import { fetchApi } from './fetch-api.ts';

export function threadQuery(threadId: string) {
  return queryOptions({
    queryKey: ['thread', threadId],
    queryFn: ({ signal }) =>
      fetchApi(`/threads/${encodeURIComponent(threadId)}`, threadSchema, signal),
  });
}
