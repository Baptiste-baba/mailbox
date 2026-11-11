import type { MailboxSummary } from '@mailbox/shared';
import { Chip, NavGroup, NavGroupAction, Swatch } from '@mailbox/ui';
import { useQuery } from '@tanstack/react-query';
import { LayoutGridIcon } from 'lucide-react';
import { mailboxesQuery } from '../api/mailboxes-query.ts';
import { comingSoon, hint } from '../hint.ts';
import { fr } from '../i18n/fr.ts';
import { NavItemSkeletons, SidebarError } from './sidebar-message.tsx';
import { SidebarNavLink } from './sidebar-nav-link.tsx';

/** "Boîtes": every mail of every mailbox, then the inbox of each mailbox. */
export function MailboxNavGroup() {
  return (
    <NavGroup
      title={fr.sidebar.mailboxes}
      action={
        <NavGroupAction {...comingSoon(fr.sidebar.manageMailboxes)}>
          {fr.sidebar.manageMailboxes}
        </NavGroupAction>
      }
    >
      <SidebarNavLink
        to="/$view"
        params={{ view: 'all' }}
        search={{}}
        icon={<LayoutGridIcon />}
        label={fr.sidebar.allMailboxes}
        title={fr.sidebar.allMailboxes}
      />
      <MailboxLinks />
    </NavGroup>
  );
}

function MailboxLinks() {
  const mailboxes = useQuery(mailboxesQuery);
  // What is shown stays when a refresh fails: only a first load that fails shows the error.
  if (mailboxes.data === undefined) {
    return mailboxes.isError ? (
      <SidebarError message={fr.common.mailboxesError} onRetry={() => mailboxes.refetch()} />
    ) : (
      <NavItemSkeletons count={3} />
    );
  }
  if (mailboxes.data.mailboxes.length === 0) {
    return <p className="px-3 py-2 text-caption text-ink-2">{fr.common.noMailbox}</p>;
  }
  return mailboxes.data.mailboxes.map((mailbox) => (
    <MailboxLink key={mailbox.id} mailbox={mailbox} />
  ));
}

function MailboxLink({ mailbox }: { mailbox: MailboxSummary }) {
  const reconnect = mailbox.status === 'reconnectRequired';
  return (
    <SidebarNavLink
      to="/$view"
      params={{ view: 'inbox' }}
      search={{ mailbox: mailbox.id }}
      icon={<Swatch color={mailbox.color} shape="circle" />}
      label={mailbox.name}
      description={mailbox.address}
      title={hint(
        mailbox.name,
        mailbox.address,
        reconnect
          ? fr.common.reconnect
          : mailbox.unreadCount > 0 && fr.common.unreadCount(mailbox.unreadCount),
      )}
      trailing={
        reconnect ? (
          <Chip tone="warn">{fr.common.reconnect}</Chip>
        ) : (
          mailbox.unreadCount || undefined
        )
      }
      marker={reconnect ? 'warn' : mailbox.unreadCount > 0 ? 'accent' : undefined}
    />
  );
}
