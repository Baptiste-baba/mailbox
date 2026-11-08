import { type ThreadPage, type ThreadView, threadPageSchema } from '@mailbox/shared';
import { type InfiniteData, infiniteQueryOptions, type QueryKey } from '@tanstack/react-query';
import { fetchApi } from './fetch-api.ts';

const PAGE_SIZE = 50;

export interface ThreadFilters {
  view: ThreadView;
  mailboxId: string | undefined;
  unreadOnly: boolean;
}

function threadsPath(filters: ThreadFilters, cursor: string | null): string {
  const query = new URLSearchParams({ view: filters.view, limit: String(PAGE_SIZE) });
  if (filters.mailboxId !== undefined) {
    query.set('mailboxId', filters.mailboxId);
  }
  if (filters.unreadOnly) {
    query.set('unreadOnly', 'true');
  }
  if (cursor !== null) {
    query.set('cursor', cursor);
  }
  return `/threads?${query}`;
}

/** The threads of a view, page after page, most recent first. */
export function threadPagesQuery(filters: ThreadFilters) {
  return infiniteQueryOptions<ThreadPage, Error, InfiniteData<ThreadPage>, QueryKey, string | null>(
    {
      queryKey: ['threads', filters],
      queryFn: ({ pageParam, signal }) =>
        fetchApi(threadsPath(filters, pageParam), threadPageSchema, signal),
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );
}
