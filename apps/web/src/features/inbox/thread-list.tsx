import type { ThreadSummary } from '@mailbox/shared';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef } from 'react';
import { mailboxesQuery, selectMailboxesById } from '../../api/mailboxes-query.ts';
import { type ThreadFilters, threadPagesQuery } from '../../api/thread-pages-query.ts';
import { fr } from '../../i18n/fr.ts';
import { LoadMoreError, ThreadListMessage, ThreadListSkeleton } from './thread-list-states.tsx';
import { ThreadRow } from './thread-row.tsx';
import { useThreadKeyboard } from './use-thread-keyboard.ts';

const ROW_HEIGHT_ESTIMATE = 116;
/** Room between two cards. */
const ROW_GAP = 8;
/** Room above the first row, so that its focus ring is not cut by the scroll area. */
const LIST_PADDING_TOP = 4;
/** The next page is asked for while this many rows remain below the visible ones. */
const LOAD_AHEAD_ROWS = 10;

/**
 * The threads of the current view, or why there is none to show. Threads already shown stay on
 * screen when a later request fails: only a first load that fails gives way to the error.
 */
export function ThreadList({ filters }: { filters: ThreadFilters }) {
  const pages = useInfiniteQuery(threadPagesQuery(filters));
  if (pages.data === undefined) {
    return pages.isError ? (
      <ThreadListMessage message={fr.inbox.error} onRetry={() => pages.refetch()} />
    ) : (
      <ThreadListSkeleton />
    );
  }
  const threads = pages.data.pages.flatMap((page) => page.threads);
  if (threads.length === 0) {
    return (
      <ThreadListMessage message={filters.unreadOnly ? fr.inbox.emptyUnread : fr.inbox.empty} />
    );
  }
  return (
    <VirtualThreadList
      threads={threads}
      filters={filters}
      // After a failure the next page waits for the user: asking again at once would loop.
      loadMore={
        pages.hasNextPage && !pages.isFetchingNextPage && !pages.isFetchNextPageError
          ? () => pages.fetchNextPage()
          : undefined
      }
      onRetryLoadMore={pages.isFetchNextPageError ? () => pages.fetchNextPage() : undefined}
    />
  );
}

interface VirtualThreadListProps {
  threads: ThreadSummary[];
  filters: ThreadFilters;
  /** Asks for the next page; absent when there is none, or while it loads. */
  loadMore: (() => void) | undefined;
  /** Asks again for the next page after it failed to load; absent otherwise. */
  onRetryLoadMore: (() => void) | undefined;
}

/** Asks for the next page while the last row in view is close to the end of the list. */
function useLoadAhead(
  loadMore: (() => void) | undefined,
  lastVisibleIndex: number,
  count: number,
): void {
  useEffect(() => {
    if (loadMore !== undefined && lastVisibleIndex >= count - LOAD_AHEAD_ROWS) {
      loadMore();
    }
  }, [loadMore, lastVisibleIndex, count]);
}

// Only the rows in view, and a few around, are in the page: the list stays fluid at any length.
function VirtualThreadList({
  threads,
  filters,
  loadMore,
  onRetryLoadMore,
}: VirtualThreadListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const mailboxes = useQuery({ ...mailboxesQuery, select: selectMailboxesById }).data;
  const virtualizer = useVirtualizer({
    count: threads.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    getItemKey: (index) => threads[index]?.id ?? index,
    paddingStart: LIST_PADDING_TOP,
    gap: ROW_GAP,
    overscan: 6,
  });
  const rows = virtualizer.getVirtualItems();
  useLoadAhead(loadMore, rows.at(-1)?.index ?? 0, threads.length);
  useThreadKeyboard(threads, filters.view, (index) => virtualizer.scrollToIndex(index));
  const now = new Date();
  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto overscroll-none pb-3 [scrollbar-gutter:stable]"
    >
      <ol className="relative" style={{ height: virtualizer.getTotalSize() }}>
        {rows.map((row) => {
          const thread = threads[row.index];
          return (
            thread !== undefined && (
              <li
                key={row.key}
                ref={virtualizer.measureElement}
                data-index={row.index}
                // The focused row goes on top, or the row after it would paint over its focus ring.
                className="absolute inset-x-4 top-0 has-focus:z-10"
                style={{ transform: `translateY(${row.start}px)` }}
              >
                <ThreadRow
                  thread={thread}
                  view={filters.view}
                  mailbox={mailboxes?.get(thread.mailboxId)}
                  now={now}
                />
              </li>
            )
          );
        })}
      </ol>
      {onRetryLoadMore !== undefined && <LoadMoreError onRetry={onRetryLoadMore} />}
    </div>
  );
}
