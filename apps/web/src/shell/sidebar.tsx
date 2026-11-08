import { NavGroup } from '@mailbox/ui';
import { useQuery } from '@tanstack/react-query';
import {
  ArchiveIcon,
  FileIcon,
  InboxIcon,
  MessageSquareIcon,
  SearchIcon,
  SendIcon,
  ShieldIcon,
  SlidersHorizontalIcon,
  TextIcon,
} from 'lucide-react';
import { mailboxesQuery, selectInboxUnreadCount } from '../api/mailboxes-query.ts';
import { hint } from '../hint.ts';
import { fr } from '../i18n/fr.ts';
import { shortcuts } from '../shortcuts.ts';
import { ComingSoonNavItem } from './coming-soon-nav-item.tsx';
import { FolderNavGroup } from './folder-nav-group.tsx';
import { MailboxNavGroup } from './mailbox-nav-group.tsx';
import { NewMailButton } from './new-mail-button.tsx';
import { SidebarNavLink } from './sidebar-nav-link.tsx';

export function Sidebar() {
  const inboxUnreadCount =
    useQuery({ ...mailboxesQuery, select: selectInboxUnreadCount }).data ?? 0;
  return (
    <nav
      aria-label={fr.sidebar.label}
      // A container: once the sidebar is folded narrow, its items shrink to their icons.
      className="@container flex h-full flex-col gap-3.5 overflow-y-auto overscroll-none px-2.5 pt-13 pb-3"
    >
      <NewMailButton />
      <NavGroup>
        <ComingSoonNavItem icon={<TextIcon />} label={fr.sidebar.briefing} />
        <SidebarNavLink
          to="/$view"
          params={{ view: 'inbox' }}
          search={{ mailbox: undefined }}
          // Active without a mailbox only: with one, the mailbox is the current page.
          activeOptions={{ explicitUndefined: true }}
          icon={<InboxIcon />}
          label={fr.sidebar.inbox}
          title={hint(
            fr.sidebar.inbox,
            inboxUnreadCount > 0 && fr.common.unreadCount(inboxUnreadCount),
          )}
          trailing={inboxUnreadCount || undefined}
          marker={inboxUnreadCount > 0 ? 'accent' : undefined}
        />
        <ComingSoonNavItem icon={<MessageSquareIcon />} label={fr.sidebar.conversations} />
        <ComingSoonNavItem
          icon={<SearchIcon />}
          label={fr.sidebar.search}
          shortcut={shortcuts.search.label}
        />
      </NavGroup>
      <MailboxNavGroup />
      <FolderNavGroup />
      <NavGroup>
        <ComingSoonNavItem icon={<FileIcon />} label={fr.sidebar.drafts} />
        <ComingSoonNavItem icon={<SendIcon />} label={fr.sidebar.sent} />
        <ComingSoonNavItem icon={<ArchiveIcon />} label={fr.sidebar.archive} />
        <ComingSoonNavItem icon={<ShieldIcon />} label={fr.sidebar.security} />
      </NavGroup>
      <NavGroup className="mt-auto">
        <ComingSoonNavItem
          icon={<SlidersHorizontalIcon />}
          label={fr.sidebar.settings}
          shortcut={shortcuts.settings.label}
        />
      </NavGroup>
    </nav>
  );
}
