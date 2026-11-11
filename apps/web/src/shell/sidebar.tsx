import { NavGroup } from '@mailbox/ui';
import { useQuery } from '@tanstack/react-query';
import { InboxIcon, MessagesSquareIcon, SearchIcon, SettingsIcon, SunIcon } from 'lucide-react';
import { mailboxesQuery, selectInboxUnreadCount } from '../api/mailboxes-query.ts';
import { Brand } from '../brand.tsx';
import { hint } from '../hint.ts';
import { fr } from '../i18n/fr.ts';
import { shortcuts } from '../shortcuts.ts';
import { ComingSoonNavItem } from './coming-soon-nav-item.tsx';
import { FolderNavGroup } from './folder-nav-group.tsx';
import { MailboxNavGroup } from './mailbox-nav-group.tsx';
import { NewMailButton } from './new-mail-button.tsx';
import { SidebarNavLink } from './sidebar-nav-link.tsx';

/**
 * The sidebar: the logo and "Nouveau mail" at the top and the settings at the bottom stay in place;
 * the destinations between them scroll when the window is too short for all of them.
 */
export function Sidebar() {
  return (
    // A container: once the sidebar is folded narrow, its items shrink to their icons.
    <div className="@container h-full">
      <nav aria-label={fr.sidebar.label} className="flex h-full flex-col pt-5 pb-4">
        <div className="flex-none px-4 @max-rail:px-2">
          <Brand className="px-2 pt-1 pb-5 @max-rail:justify-center @max-rail:px-0" />
          <NewMailButton />
        </div>
        {/* Padded inside the scroll, so that the focus ring of an item is never cut off. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-4 py-1 @max-rail:px-2">
          <SidebarDestinations />
        </div>
        <NavGroup className="flex-none px-4 pt-3 @max-rail:px-2">
          <SidebarNavLink
            to="/settings"
            icon={<SettingsIcon />}
            label={fr.sidebar.settings}
            title={fr.sidebar.settings}
          />
        </NavGroup>
      </nav>
    </div>
  );
}

/** Where to go: the views, the mailboxes, then the folders. */
function SidebarDestinations() {
  const inboxUnreadCount =
    useQuery({ ...mailboxesQuery, select: selectInboxUnreadCount }).data ?? 0;
  return (
    <>
      <NavGroup>
        <ComingSoonNavItem icon={<SunIcon />} label={fr.sidebar.briefing} />
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
        <ComingSoonNavItem icon={<MessagesSquareIcon />} label={fr.sidebar.conversations} />
        <ComingSoonNavItem
          icon={<SearchIcon />}
          label={fr.sidebar.search}
          shortcut={shortcuts.search.label}
        />
      </NavGroup>
      <MailboxNavGroup />
      <FolderNavGroup />
    </>
  );
}
