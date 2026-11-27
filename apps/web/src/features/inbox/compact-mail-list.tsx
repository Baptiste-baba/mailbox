import { useState } from 'react';
import type { ThreadFilters } from '../../api/thread-pages-query.ts';
import { CollapsingTitle } from './collapsing-title.tsx';
import { CompactListHeader } from './compact-list-header.tsx';
import { ThreadList } from './thread-list.tsx';
import { useUnreadFilter } from './unread-filter.ts';
import { useHeaderCollapse, useHeaderParts } from './use-header-collapse.ts';
import { useViewSummary } from './view-summary.ts';

/**
 * The list on a phone, over the whole height of the screen: its header scrolls away with the
 * threads and turns into bubbles floating above them.
 */
export function CompactMailList({ filters }: { filters: ThreadFilters }) {
  const { filter, choose } = useUnreadFilter(filters);
  const { title, unreadCount, place } = useViewSummary(filters);
  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  const parts = useHeaderParts();
  const collapsed = useHeaderCollapse(scroller, parts, `${title} ${unreadCount}`);
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <ThreadList
        // A new view starts at its top, not at the scroll position of the previous one.
        key={`${filters.view}-${filters.mailboxId}-${filters.unreadOnly}`}
        filters={filters}
        header={
          <CompactListHeader
            filter={filter}
            onChoose={choose}
            place={place}
            parts={parts}
            collapsed={collapsed}
          />
        }
        onScroller={setScroller}
      />
      <CollapsingTitle
        title={title}
        unreadCount={unreadCount}
        filter={filter}
        onChoose={choose}
        parts={parts}
        collapsed={collapsed}
        onBackToTop={() => scroller?.scrollTo({ top: 0, behavior: 'smooth' })}
      />
    </div>
  );
}
