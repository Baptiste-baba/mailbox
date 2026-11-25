import type { MailboxSummary } from '@mailbox/shared';
import { Card, Chip, Skeleton, StateMessage, Swatch } from '@mailbox/ui';
import { useQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { mailboxesQuery } from '../../api/mailboxes-query.ts';
import { fr } from '../../i18n/fr.ts';

/** The connected mailboxes, in the settings. */
export function MailboxSettings() {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 id={titleId} className="text-subject font-semibold text-heading">
          {fr.mailboxes.title}
        </h2>
        <p className="text-small text-ink-2">{fr.mailboxes.intro}</p>
      </div>
      <Card>
        <MailboxList />
      </Card>
    </section>
  );
}

/** The mailboxes, in the order they were connected, or why there is none to show. */
function MailboxList() {
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
  return (
    <ul className="divide-y divide-line">
      {mailboxes.data.mailboxes.map((mailbox) => (
        <MailboxRow key={mailbox.id} mailbox={mailbox} />
      ))}
    </ul>
  );
}

function MailboxRow({ mailbox }: { mailbox: MailboxSummary }) {
  return (
    <li className="flex items-center gap-4 px-6 py-4">
      <span className="grid size-4.5 flex-none place-items-center">
        <Swatch color={mailbox.color} shape="circle" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base font-medium text-ink">{mailbox.name}</span>
        <span className="truncate text-small text-ink-2">{mailbox.address}</span>
      </div>
      {mailbox.status === 'reconnectRequired' ? (
        <Chip tone="warn">{fr.mailboxes.reconnectRequired}</Chip>
      ) : (
        <span className="flex-none text-small text-ink-2">{fr.mailboxes.connected}</span>
      )}
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
