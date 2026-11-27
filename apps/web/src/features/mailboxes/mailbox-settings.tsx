import type { MailboxSummary } from '@mailbox/shared';
import { Button, Card, Chip, Skeleton, StateMessage, Swatch } from '@mailbox/ui';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { mailProvidersQuery } from '../../api/mail-providers-query.ts';
import { mailboxesQuery } from '../../api/mailboxes-query.ts';
import { fr } from '../../i18n/fr.ts';
import { AddMailboxDialog } from './add-mailbox-dialog.tsx';
import { MailboxSyncBadge, MailboxSyncDetail } from './mailbox-sync-status.tsx';
import { ReconnectMailboxDialog } from './reconnect-mailbox-dialog.tsx';
import { RemoveMailboxDialog } from './remove-mailbox-dialog.tsx';

/** The connected mailboxes, in the settings: seeing them, adding, reconnecting or removing one. */
export function MailboxSettings() {
  const titleId = useId();
  const [adding, setAdding] = useState(false);
  const [reconnecting, setReconnecting] = useState<MailboxSummary>();
  const [removing, setRemoving] = useState<MailboxSummary>();
  const providers = useQuery(mailProvidersQuery);
  const gmailConfigured = providers.data?.providers.includes('gmail');
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-6">
          <h2 id={titleId} className="text-subject font-semibold text-heading">
            {fr.mailboxes.title}
          </h2>
          <Button
            variant="primary"
            onClick={() => setAdding(true)}
            disabled={gmailConfigured !== true}
          >
            <PlusIcon />
            {fr.mailboxes.add}
          </Button>
        </div>
        <p className="text-small text-ink-2">{fr.mailboxes.intro}</p>
      </div>
      {gmailConfigured === false && (
        <p className="rounded-md bg-field px-4 py-3 text-small text-ink">
          {fr.mailboxes.notConfigured}
        </p>
      )}
      <Card>
        <MailboxList onReconnect={setReconnecting} onRemove={setRemoving} />
      </Card>
      <AddMailboxDialog open={adding} onClose={() => setAdding(false)} />
      <ReconnectMailboxDialog mailbox={reconnecting} onClose={() => setReconnecting(undefined)} />
      <RemoveMailboxDialog mailbox={removing} onClose={() => setRemoving(undefined)} />
    </section>
  );
}

interface MailboxListProps {
  onReconnect: (mailbox: MailboxSummary) => void;
  onRemove: (mailbox: MailboxSummary) => void;
}

/** The mailboxes, in the order they were connected, or why there is none to show. */
function MailboxList({ onReconnect, onRemove }: MailboxListProps) {
  const mailboxes = useQuery(mailboxesQuery);
  if (mailboxes.data === undefined) {
    return mailboxes.isError ? (
      <StateMessage
        message={fr.common.mailboxesError}
        action={{ label: fr.common.retry, onClick: () => mailboxes.refetch() }}
        className="px-6 py-10"
      />
    ) : (
      <MailboxListSkeleton />
    );
  }
  if (mailboxes.data.mailboxes.length === 0) {
    return <StateMessage message={fr.mailboxes.none} className="px-6 py-10" />;
  }
  const now = new Date();
  return (
    <ul className="divide-y divide-line">
      {mailboxes.data.mailboxes.map((mailbox) => (
        <MailboxRow
          key={mailbox.id}
          mailbox={mailbox}
          now={now}
          onReconnect={() => onReconnect(mailbox)}
          onRemove={() => onRemove(mailbox)}
        />
      ))}
    </ul>
  );
}

interface MailboxRowProps {
  mailbox: MailboxSummary;
  now: Date;
  onReconnect: () => void;
  onRemove: () => void;
}

function MailboxRow({ mailbox, now, onReconnect, onRemove }: MailboxRowProps) {
  return (
    <li className="flex items-center gap-4 py-4 pr-4 pl-6">
      <span className="grid size-4.5 flex-none place-items-center">
        <Swatch color={mailbox.color} shape="circle" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base font-medium text-ink">{mailbox.name}</span>
        <span className="truncate text-small text-ink-2">{mailbox.address}</span>
        {mailbox.status === 'connected' && <MailboxSyncDetail sync={mailbox.sync} now={now} />}
      </div>
      {mailbox.status === 'reconnectRequired' ? (
        <>
          <Chip tone="warn">{fr.mailboxes.reconnectRequired}</Chip>
          <Button
            variant="text"
            size="sm"
            onClick={onReconnect}
            aria-label={fr.mailboxes.reconnectMailbox(mailbox.name)}
          >
            {fr.common.reconnect}
          </Button>
        </>
      ) : (
        <MailboxSyncBadge sync={mailbox.sync} now={now} />
      )}
      <Button
        variant="text"
        size="sm"
        onClick={onRemove}
        aria-label={fr.mailboxes.removeLabel(mailbox.name)}
      >
        {fr.mailboxes.remove}
      </Button>
    </li>
  );
}

/** Two rows in the shape of mailboxes, line for line: nothing moves once they arrive. */
function MailboxListSkeleton() {
  return (
    <ul aria-hidden="true" className="divide-y divide-line">
      {['first', 'second'].map((row) => (
        <li key={row} className="flex items-center gap-4 px-6 py-4">
          <Skeleton className="size-4.5 flex-none" />
          <div className="flex flex-1 flex-col">
            <div className="flex h-5.5 items-center">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-52" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
