import type { MailboxSummary } from '@mailbox/shared';
import { Button, Chip, FieldLine, Select, Skeleton, Swatch } from '@mailbox/ui';
import { useQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { useId } from 'react';
import { mailboxesQuery } from '../../api/mailboxes-query.ts';
import { fr } from '../../i18n/fr.ts';

const composeRoute = getRouteApi('/_shell/$view/new');

interface SenderLineProps {
  chosenId: string | undefined;
  onChoose: (mailboxId: string) => void;
}

/** "De": the mailbox the mail is sent from, with its colour, so that it is never sent by mistake. */
export function SenderLine({ chosenId, onChoose }: SenderLineProps) {
  const id = useId();
  const listMailboxId = composeRoute.useSearch().mailbox;
  const mailboxes = useQuery(mailboxesQuery);
  const list = mailboxes.data?.mailboxes;
  const sender =
    list?.find((mailbox) => mailbox.id === chosenId) ??
    list?.find((mailbox) => mailbox.id === listMailboxId) ??
    list?.[0];
  let content = <Skeleton className="my-1.75 h-3.5 w-64" />;
  if (sender !== undefined && list !== undefined) {
    content = <SenderSelect id={id} sender={sender} mailboxes={list} onChoose={onChoose} />;
  } else if (list !== undefined) {
    content = <p className="py-0.5 text-ink-2">{fr.common.noMailbox}</p>;
  } else if (mailboxes.isError) {
    content = (
      <div className="flex items-center gap-2 text-ink-2">
        <p>{fr.common.mailboxesError}</p>
        <Button variant="text" size="sm" onClick={() => mailboxes.refetch()} className="-my-0.5">
          {fr.common.retry}
        </Button>
      </div>
    );
  }
  return (
    <FieldLine label={fr.compose.from} htmlFor={id}>
      {content}
    </FieldLine>
  );
}

interface SenderSelectProps {
  id: string;
  sender: MailboxSummary;
  mailboxes: MailboxSummary[];
  onChoose: (mailboxId: string) => void;
}

function SenderSelect({ id, sender, mailboxes, onChoose }: SenderSelectProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Select
        id={id}
        value={sender.id}
        onChange={onChoose}
        options={mailboxes.map((mailbox) => ({
          value: mailbox.id,
          label: fr.compose.senderOption(mailbox.name, mailbox.address),
        }))}
      >
        <Swatch color={sender.color} shape="circle" />
        <span className="flex-none font-medium text-ink">{sender.name}</span>
        <span className="truncate">{sender.address}</span>
      </Select>
      {sender.status === 'reconnectRequired' && <Chip tone="warn">{fr.common.reconnect}</Chip>}
    </div>
  );
}
