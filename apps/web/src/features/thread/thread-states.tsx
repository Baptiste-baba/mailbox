import { Card, Skeleton, StateMessage } from '@mailbox/ui';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { fr } from '../../i18n/fr.ts';

/** Why the thread pane shows no thread, centred in it, with what to do about it. */
export function ThreadMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <StateMessage
      message={message}
      action={onRetry === undefined ? undefined : { label: fr.common.retry, onClick: onRetry }}
      className="flex-1 justify-center px-10"
    />
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

/** The shape of a thread while it loads. */
export function ThreadSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-5.5 px-10 pt-20">
      <Skeleton className="h-6 w-3/5" />
      <Skeleton className="h-3 w-2/5" />
      <Card className="flex gap-3 px-4 py-4.5">
        <Skeleton className="size-7.5 flex-none rounded-full" />
        <div className="flex flex-1 flex-col gap-2.5 pt-1">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </Card>
    </div>
  );
}
