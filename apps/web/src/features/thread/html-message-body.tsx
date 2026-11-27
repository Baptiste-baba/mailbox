import type { Message } from '@mailbox/shared';
import { Skeleton, StateMessage } from '@mailbox/ui';
import { useQuery } from '@tanstack/react-query';
import { messageBodyQuery } from '../../api/message-body-query.ts';
import { fr } from '../../i18n/fr.ts';
import { MailFrame } from './mail-frame.tsx';
import { TextBody } from './text-body.tsx';

/** Lines in the shape of a mail while its HTML loads. */
function HtmlBodySkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2.5 pt-1">
      <Skeleton className="h-3.5 w-4/5" />
      <Skeleton className="h-3.5 w-3/5" />
      <Skeleton className="h-3.5 w-2/3" />
    </div>
  );
}

/**
 * The HTML body of a message, read when the message is opened. When it cannot be read, the text
 * of the mail stands in for it, with the way to ask for it again.
 */
export function HtmlMessageBody({ message }: { message: Message }) {
  const body = useQuery(messageBodyQuery(message.id));
  if (body.isError) {
    return (
      <>
        <StateMessage
          message={fr.thread.htmlError}
          action={{ label: fr.common.retry, onClick: () => body.refetch() }}
          layout="inline"
        />
        <TextBody message={message} />
      </>
    );
  }
  if (body.data === undefined) {
    return <HtmlBodySkeleton />;
  }
  return body.data.html === null ? (
    <TextBody message={message} />
  ) : (
    <MailFrame html={body.data.html} />
  );
}
