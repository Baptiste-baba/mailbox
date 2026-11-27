import { Chip, SegmentedControl } from '@mailbox/ui';
import type { ThreadFilters } from '../../api/thread-pages-query.ts';
import { fr } from '../../i18n/fr.ts';
import { MailSearchField } from './mail-search-field.tsx';
import { unreadFilterOptions, useUnreadFilter } from './unread-filter.ts';
import { useViewSummary } from './view-summary.ts';

/** Title of the view with its unread count, the choice between every thread and unread ones, then search. */
export function MailListHeader({ filters }: { filters: ThreadFilters }) {
  const { filter, choose } = useUnreadFilter(filters);
  const { title, unreadCount, place } = useViewSummary(filters);
  return (
    // Keeps the room of the list's scroll bar, so that tabs, search and cards share their edges.
    <div className="flex-none overflow-hidden px-4 pt-5 [scrollbar-gutter:stable]">
      <div className="flex items-center gap-3">
        <h1 className="truncate text-title font-semibold text-heading">{title}</h1>
        {unreadCount !== undefined && unreadCount > 0 && (
          <Chip tone="tint">{fr.common.unreadCount(unreadCount)}</Chip>
        )}
      </div>
      <SegmentedControl
        label={fr.inbox.filterLabel}
        options={unreadFilterOptions}
        value={filter}
        onChange={choose}
        className="mt-4"
      />
      <MailSearchField place={place} />
    </div>
  );
}
