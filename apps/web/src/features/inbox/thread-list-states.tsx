import { Skeleton, StateMessage } from '@mailbox/ui';
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

/** What the list shows instead of threads: why there is none, and what to do about it. */
export function ThreadListMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <StateMessage
      message={message}
      action={onRetry === undefined ? undefined : { label: fr.common.retry, onClick: onRetry }}
      className="px-8 pt-16"
    />
  );
}

/** The end of a list whose next page failed to load, with the way to ask for it again. */
export function LoadMoreError({ onRetry }: { onRetry: () => void }) {
  return (
    <StateMessage
      message={fr.inbox.loadMoreError}
      action={{ label: fr.common.retry, onClick: onRetry }}
      layout="inline"
      className="justify-center py-3"
    />
  );
}

/** Stands in for the list when it fails to render, so that the rest of the app stays usable. */
export function ThreadListCrash({ reset }: ErrorComponentProps) {
  return <ThreadListMessage message={fr.inbox.crash} onRetry={reset} />;
}
