import { Button, Skeleton } from '@mailbox/ui';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { fr } from '../../i18n/fr.ts';

const SKELETON_ROW_IDS = Array.from({ length: 8 }, (_, index) => `skeleton-row-${index}`);

/** Rows in the shape of threads while the first page loads. */
export function ThreadListSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col px-1.5">
      {SKELETON_ROW_IDS.map((rowId) => (
        <div key={rowId} className="flex gap-2.5 pt-2.5 pr-3 pb-2.75 pl-4">
          <Skeleton className="size-7.5 rounded-full" />
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="mt-1 h-2.5 w-1/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ThreadListMessageProps {
  message: string;
  onRetry?: () => void;
}

/** What the list shows instead of threads: why there is none, and what to do about it. */
export function ThreadListMessage({ message, onRetry }: ThreadListMessageProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-8 pt-16 text-center text-ink3">
      <p>{message}</p>
      {onRetry !== undefined && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {fr.common.retry}
        </Button>
      )}
    </div>
  );
}

/** Stands in for the list when it fails to render, so that the rest of the app stays usable. */
export function ThreadListCrash({ reset }: ErrorComponentProps) {
  return <ThreadListMessage message={fr.inbox.crash} onRetry={reset} />;
}
