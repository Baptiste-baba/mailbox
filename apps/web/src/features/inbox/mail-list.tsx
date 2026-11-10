import { MailListHeader } from './mail-list-header.tsx';
import { ThreadList } from './thread-list.tsx';
import { useThreadFilters } from './use-thread-filters.ts';

/** The list column: title, filter and search, then the threads. */
export function MailList() {
  const filters = useThreadFilters();
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
