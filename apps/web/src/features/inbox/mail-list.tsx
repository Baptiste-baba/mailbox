import { useLayout } from '../../shell/layout.ts';
import { CompactMailList } from './compact-mail-list.tsx';
import { MailListHeader } from './mail-list-header.tsx';
import { ThreadList } from './thread-list.tsx';
import { useThreadFilters } from './use-thread-filters.ts';

/**
 * The list column: title, filter and search, then the threads. On a phone, the header scrolls
 * away with the threads.
 */
export function MailList() {
  const filters = useThreadFilters();
  const layout = useLayout();
  if (layout !== 'desktop') {
    return <CompactMailList filters={filters} />;
  }
  return (
    <>
      <MailListHeader filters={filters} />
      {/* A new view starts at its top, not at the scroll position of the previous one. */}
      <ThreadList
        key={`${filters.view}-${filters.mailboxId}-${filters.unreadOnly}`}
        filters={filters}
      />
    </>
  );
}
