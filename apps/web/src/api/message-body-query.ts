import { messageBodySchema } from '@mailbox/shared';
import { queryOptions } from '@tanstack/react-query';
import { fetchApi } from './fetch-api.ts';

/** The HTML body of a message, read when it is opened. A mail never changes: it is read once. */
export function messageBodyQuery(messageId: string) {
  return queryOptions({
    queryKey: ['message-body', messageId],
    queryFn: ({ signal }) =>
      fetchApi(`/messages/${encodeURIComponent(messageId)}/body`, messageBodySchema, signal),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
