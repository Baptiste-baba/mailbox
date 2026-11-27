import type { MailboxSummary } from '@mailbox/shared';
import { Swatch } from '@mailbox/ui';

/** The mailbox a thread is in, by its colour and its name; its address on hover. */
export function MailboxName({ mailbox }: { mailbox: MailboxSummary }) {
  return (
    <span className="flex flex-none items-center gap-2.5" title={mailbox.address}>
      <Swatch color={mailbox.color} shape="circle" />
      {mailbox.name}
    </span>
  );
}
