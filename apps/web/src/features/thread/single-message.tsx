import type { MailboxSummary, Message } from '@mailbox/shared';
import { MailboxName } from './mailbox-name.tsx';
import { MessageBody } from './message-body.tsx';
import { MessageHeading } from './message-heading.tsx';
import { ThreadHeader } from './thread-header.tsx';

interface SingleMessageProps {
  subject: string;
  message: Message;
  mailbox: MailboxSummary | undefined;
}

/** A thread of one message: its sender stands under the subject, then its body takes the width. */
export function SingleMessage({ subject, message, mailbox }: SingleMessageProps) {
  return (
    <>
      <ThreadHeader subject={subject}>
        <MessageHeading message={message} ownAddress={mailbox?.address} now={new Date()}>
          {mailbox !== undefined && <MailboxName mailbox={mailbox} />}
        </MessageHeading>
      </ThreadHeader>
      <MessageBody message={message} />
    </>
  );
}
