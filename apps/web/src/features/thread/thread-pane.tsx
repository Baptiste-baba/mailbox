import type { Thread } from '@mailbox/shared';
import { useQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { ApiError } from '../../api/api-error.ts';
import { mailboxesQuery } from '../../api/mailboxes-query.ts';
import { threadQuery } from '../../api/thread-query.ts';
import { fr } from '../../i18n/fr.ts';
import { ReplyBar } from './reply-bar.tsx';
import { ThreadHeader } from './thread-header.tsx';
import { ThreadMessages } from './thread-messages.tsx';
import { ThreadMessage, ThreadSkeleton } from './thread-states.tsx';
import { ThreadToolbar } from './thread-toolbar.tsx';

const threadRoute = getRouteApi('/_shell/$view/$id');

/** The open thread, or why it cannot be shown. */
export function ThreadPane() {
  const { id } = threadRoute.useParams();
  const thread = useQuery(threadQuery(id));
  if (thread.isPending) {
    return <ThreadSkeleton />;
  }
  if (thread.isError) {
    return thread.error instanceof ApiError && thread.error.code === 'THREAD_NOT_FOUND' ? (
      <ThreadMessage message={fr.thread.notFound} />
    ) : (
      <ThreadMessage message={fr.thread.error} onRetry={() => thread.refetch()} />
    );
  }
  // A new thread starts with its own messages folded, whatever was open in the previous one.
  return <OpenThread key={thread.data.id} thread={thread.data} />;
}

function OpenThread({ thread }: { thread: Thread }) {
  const mailbox = useQuery(mailboxesQuery).data?.mailboxes.find(
    (candidate) => candidate.id === thread.mailboxId,
  );
  const latestMessage = thread.messages.at(-1);
  return (
    <>
      <ThreadToolbar />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* At least as tall as the pane, so that the open message can stretch to its bottom. */}
        <article className="flex min-h-full flex-col gap-5.5 px-10 pt-7 pb-6">
          <ThreadHeader thread={thread} mailbox={mailbox} />
          <ThreadMessages
            thread={thread}
            ownAddress={mailbox?.address}
            reply={
              latestMessage !== undefined && (
                <ReplyBar latestMessage={latestMessage} ownAddress={mailbox?.address} />
              )
            }
          />
        </article>
      </div>
    </>
  );
}
