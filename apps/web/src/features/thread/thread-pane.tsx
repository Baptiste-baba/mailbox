import type { Thread } from '@mailbox/shared';
import { useQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { ApiError } from '../../api/api-error.ts';
import { mailboxesQuery } from '../../api/mailboxes-query.ts';
import { threadQuery } from '../../api/thread-query.ts';
import { fr } from '../../i18n/fr.ts';
import { ReplyBar } from './reply-bar.tsx';
import { ThreadFrame } from './thread-frame.tsx';
import { ThreadHeader } from './thread-header.tsx';
import { ThreadMessages } from './thread-messages.tsx';
import { ThreadMessage, ThreadSkeleton } from './thread-states.tsx';
import { ThreadToolbar } from './thread-toolbar.tsx';

const threadRoute = getRouteApi('/_shell/$view/$id');

function isNotFound(error: Error | null): boolean {
  return error instanceof ApiError && error.code === 'THREAD_NOT_FOUND';
}

/**
 * The open thread, or why it cannot be shown. A thread on screen stays there when a refresh fails,
 * unless the server says it no longer exists.
 */
export function ThreadPane() {
  const { id } = threadRoute.useParams();
  const thread = useQuery(threadQuery(id));
  if (isNotFound(thread.error)) {
    return <ThreadMessage message={fr.thread.notFound} />;
  }
  if (thread.data === undefined) {
    return thread.isError ? (
      <ThreadMessage message={fr.thread.error} onRetry={() => thread.refetch()} />
    ) : (
      <ThreadSkeleton />
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
    <ThreadFrame>
      <ThreadToolbar />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-none">
        <article className="flex flex-col gap-6 px-9 py-7">
          <ThreadHeader thread={thread} mailbox={mailbox} />
          <ThreadMessages thread={thread} ownAddress={mailbox?.address} />
        </article>
      </div>
      {latestMessage !== undefined && (
        <ReplyBar latestMessage={latestMessage} ownAddress={mailbox?.address} />
      )}
    </ThreadFrame>
  );
}
