import { Skeleton, StateMessage } from '@mailbox/ui';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { fr } from '../../i18n/fr.ts';
import { ThreadFrame } from './thread-frame.tsx';
import { ThreadToolbar } from './thread-toolbar.tsx';

/** Why the thread pane shows no thread, centred in its card, with what to do about it. */
export function ThreadMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <ThreadFrame>
      <StateMessage
        message={message}
        action={onRetry === undefined ? undefined : { label: fr.common.retry, onClick: onRetry }}
        className="flex-1 justify-center px-10"
      />
    </ThreadFrame>
  );
}

/** The pane before a thread is chosen. */
export function ThreadPlaceholder() {
  return <ThreadMessage message={fr.thread.placeholder} />;
}

/** Stands in for the thread when it fails to render, so that the list stays usable. */
export function ThreadCrash({ reset }: ErrorComponentProps) {
  return <ThreadMessage message={fr.thread.crash} onRetry={reset} />;
}

/** The shape of a thread while it loads, under its toolbar: nothing moves once it arrives. */
export function ThreadSkeleton() {
  return (
    <ThreadFrame>
      <ThreadToolbar />
      <div aria-hidden="true" className="flex flex-col gap-6 px-9 py-7">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-3/5" />
          <Skeleton className="h-3.5 w-2/5" />
        </div>
        <div className="flex gap-3.5 rounded-lg border border-line px-4.5 py-5">
          <Skeleton className="size-9 flex-none rounded-full" />
          <div className="flex flex-1 flex-col gap-3 pt-1">
            <Skeleton className="h-3.5 w-1/4" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        </div>
      </div>
    </ThreadFrame>
  );
}
