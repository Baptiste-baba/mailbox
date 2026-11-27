import { useNavigate } from '@tanstack/react-router';
import type { ThreadFilters } from '../../api/thread-pages-query.ts';
import { fr } from '../../i18n/fr.ts';
import { useShortcut } from '../../use-shortcut.ts';

export type UnreadFilter = 'all' | 'unread';

export const unreadFilterOptions: { value: UnreadFilter; label: string }[] = [
  { value: 'all', label: fr.inbox.filterAll },
  { value: 'unread', label: fr.inbox.filterUnread },
];

/**
 * Every thread of the view, or the unread ones only: the current choice, and how to change it from
 * a control. U switches between the two.
 */
export function useUnreadFilter(filters: ThreadFilters) {
  const navigate = useNavigate();
  const choose = (filter: UnreadFilter) =>
    navigate({
      to: '.',
      search: (previous) => ({ ...previous, unread: filter === 'unread' || undefined }),
    });
  useShortcut('unreadOnly', () => choose(filters.unreadOnly ? 'all' : 'unread'));
  const filter: UnreadFilter = filters.unreadOnly ? 'unread' : 'all';
  return { filter, choose };
}
