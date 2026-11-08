import { Button, Kbd, NavGroup } from '@mailbox/ui';
import { useQuery } from '@tanstack/react-query';
import {
  ArchiveIcon,
  FileIcon,
  InboxIcon,
  MessageSquareIcon,
  PencilIcon,
  SearchIcon,
  SendIcon,
  ShieldIcon,
  SlidersHorizontalIcon,
  TextIcon,
} from 'lucide-react';
import { mailboxesQuery } from '../api/mailboxes-query.ts';
import { fr } from '../i18n/fr.ts';
import { shortcutLabels } from '../shortcuts.ts';
import { ComingSoonNavItem } from './coming-soon-nav-item.tsx';
import { FolderNavGroup } from './folder-nav-group.tsx';
import { MailboxNavGroup } from './mailbox-nav-group.tsx';
import { SidebarNavLink } from './sidebar-nav-link.tsx';

export function Sidebar() {
  const mailboxes = useQuery(mailboxesQuery);
  const inboxUnreadCount = mailboxes.data?.mailboxes.reduce(
    (total, mailbox) => total + mailbox.unreadCount,
    0,
  );
  return (
    <nav
      aria-label={fr.sidebar.label}
      className="flex w-57 flex-none flex-col gap-3.5 overflow-y-auto bg-mist px-2.5 pt-13 pb-3 shadow-hairline-end"
    >
      <Button
        variant="primary"
        size="lg"
        shortcut={shortcutLabels.newMail}
        disabled
        title={fr.common.comingSoon}
        className="w-full"
      >
        <PencilIcon />
        {fr.sidebar.newMail}
      </Button>
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
          trailing={inboxUnreadCount || undefined}
        />
        <ComingSoonNavItem icon={<MessageSquareIcon />} label={fr.sidebar.conversations} />
        <ComingSoonNavItem
          icon={<SearchIcon />}
          label={fr.sidebar.search}
          trailing={<Kbd>{shortcutLabels.search}</Kbd>}
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
          trailing={<Kbd>{shortcutLabels.settings}</Kbd>}
        />
      </NavGroup>
    </nav>
  );
}
