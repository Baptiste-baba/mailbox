import type { ThreadSummary } from '@mailbox/shared';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
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

interface ThreadListProps {
  filters: ThreadFilters;
  /** A header scrolling away with the threads, above them, as on a phone. */
  header?: ReactNode | undefined;
  /** Told the element that scrolls the threads, once there are threads to scroll. */
  onScroller?: ((scroller: HTMLElement | null) => void) | undefined;
}

/**
 * The threads of the current view, or why there is none to show. Threads already shown stay on
 * screen when a later request fails: only a first load that fails gives way to the error.
 */
export function ThreadList({ filters, header, onScroller }: ThreadListProps) {
  const pages = useInfiniteQuery(threadPagesQuery(filters));
  if (pages.data === undefined) {
    return (
      <>
        {header}
        {pages.isError ? (
          <ThreadListMessage message={fr.inbox.error} onRetry={() => pages.refetch()} />
        ) : (
          <ThreadListSkeleton />
        )}
      </>
    );
  }
  const threads = pages.data.pages.flatMap((page) => page.threads);
  if (threads.length === 0) {
    return (
      <>
        {header}
        <ThreadListMessage message={filters.unreadOnly ? fr.inbox.emptyUnread : fr.inbox.empty} />
      </>
    );
  }
  return (
    <VirtualThreadList
      threads={threads}
      filters={filters}
      header={header}
      onScroller={onScroller}
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

interface VirtualThreadListProps extends Pick<ThreadListProps, 'header' | 'onScroller'> {
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

/**
 * The height of what comes before the list in its scroll, the header, kept as it changes: 0 when
 * there is none.
 */
function useHeight(scrollRef: RefObject<HTMLDivElement | null>, hasHeader: boolean): number {
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    const header = hasHeader ? scrollRef.current?.firstElementChild : null;
    if (header === null || header === undefined) {
      return;
    }
    const observer = new ResizeObserver(() => setHeight(header.getBoundingClientRect().height));
    observer.observe(header);
    return () => observer.disconnect();
  }, [scrollRef, hasHeader]);
  return height;
}

/** Places the rows of `threads` in their scroll, below a header `headerHeight` tall. */
function useThreadVirtualizer(
  threads: ThreadSummary[],
  scrollRef: RefObject<HTMLDivElement | null>,
  headerHeight: number,
) {
  return useVirtualizer({
    count: threads.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    getItemKey: (index) => threads[index]?.id ?? index,
    scrollMargin: headerHeight,
    paddingStart: LIST_PADDING_TOP,
    gap: ROW_GAP,
    overscan: 6,
  });
}

// Only the rows in view, and a few around, are in the page: the list stays fluid at any length.
function VirtualThreadList({
  threads,
  filters,
  header,
  onScroller,
  loadMore,
  onRetryLoadMore,
}: VirtualThreadListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerHeight = useHeight(scrollRef, header !== undefined);
  const mailboxes = useQuery({ ...mailboxesQuery, select: selectMailboxesById }).data;
  const virtualizer = useThreadVirtualizer(threads, scrollRef, headerHeight);
  const rows = virtualizer.getVirtualItems();
  useLoadAhead(loadMore, rows.at(-1)?.index ?? 0, threads.length);
  useThreadKeyboard(threads, filters.view, (index) => virtualizer.scrollToIndex(index));
  const now = new Date();
  return (
    <div
      ref={(scroller) => {
        scrollRef.current = scroller;
        onScroller?.(scroller);
      }}
      // On a phone, room at the end for the last card to scroll clear of "Nouveau", floating over it
      // above the home bar.
      className="min-h-0 flex-1 overflow-y-auto overscroll-none pb-3 [scrollbar-gutter:stable] compact:pb-[calc(--spacing(24)+var(--screen-bottom))]"
    >
      {header}
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
                className="absolute inset-x-4 top-0 focus-within:z-10 compact:inset-x-2"
                style={{ transform: `translateY(${row.start - headerHeight}px)` }}
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
