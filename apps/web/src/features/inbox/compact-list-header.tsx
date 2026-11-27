import { SegmentedControl } from '@mailbox/ui';
import { fr } from '../../i18n/fr.ts';
import { MailSearchField } from './mail-search-field.tsx';
import { type UnreadFilter, unreadFilterOptions } from './unread-filter.ts';
import type { HeaderParts } from './use-header-collapse.ts';

interface CompactListHeaderProps {
  filter: UnreadFilter;
  onChoose: (filter: UnreadFilter) => void;
  /** Where the search looks, such as "la réception". */
  place: string;
  parts: HeaderParts;
  /** Scrolled away: the bubbles stand for it. */
  collapsed: boolean;
}

/**
 * The header of the list on a phone, scrolling away with the threads: the room for ☰ and the
 * title, which stay above the list, then the filter and the search.
 */
export function CompactListHeader({
  filter,
  onChoose,
  place,
  parts,
  collapsed,
}: CompactListHeaderProps) {
  return (
    <div inert={collapsed} className="px-2 pt-screen-2">
      <div className="h-11" />
      <div ref={parts.tabs}>
        <SegmentedControl
          label={fr.inbox.filterLabel}
          options={unreadFilterOptions}
          value={filter}
          onChange={onChoose}
          className="mt-2"
        />
      </div>
      <div ref={parts.search}>
        <MailSearchField place={place} />
      </div>
    </div>
  );
}
