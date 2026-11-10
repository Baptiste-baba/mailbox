import { Skeleton, StateMessage } from '@mailbox/ui';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { fr } from '../i18n/fr.ts';

/** What a part of the sidebar shows when its data could not be loaded. */
export function SidebarError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <StateMessage
      message={message}
      action={{ label: fr.common.retry, onClick: onRetry }}
      layout="inline"
      className="px-3 py-2"
    />
  );
}

/** Placeholders for navigation items while they load. */
export function NavItemSkeletons({ count }: { count: number }) {
  const placeholderIds = Array.from({ length: count }, (_, index) => `placeholder-${index}`);
  return placeholderIds.map((placeholderId) => (
    <div key={placeholderId} className="flex h-10 items-center gap-3 px-3">
      <Skeleton className="size-4.5" />
      <Skeleton className="h-3 w-28" />
    </div>
  ));
}

/** Stands in for the whole sidebar when it fails to render, so that the rest of the app stays usable. */
export function SidebarCrash({ reset }: ErrorComponentProps) {
  return (
    <div className="px-4 pt-5">
      <SidebarError message={fr.sidebar.crash} onRetry={reset} />
    </div>
  );
}
