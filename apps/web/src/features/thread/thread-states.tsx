import { Button, Card, Skeleton } from '@mailbox/ui';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { fr } from '../../i18n/fr.ts';

interface ThreadMessageProps {
  message: string;
  onRetry?: () => void;
}

/** What the thread pane shows instead of a thread: why, and what to do about it. */
export function ThreadMessage({ message, onRetry }: ThreadMessageProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-10 text-center text-ink3">
      <p className="max-w-sm">{message}</p>
      {onRetry !== undefined && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {fr.common.retry}
        </Button>
      )}
    </div>
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
