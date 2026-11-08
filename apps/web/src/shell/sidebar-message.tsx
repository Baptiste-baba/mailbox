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
      className="px-2 py-1"
    />
  );
}

/** Placeholders for navigation items while they load. */
export function NavItemSkeletons({ count }: { count: number }) {
  const placeholderIds = Array.from({ length: count }, (_, index) => `placeholder-${index}`);
  return placeholderIds.map((placeholderId) => (
    <div key={placeholderId} className="flex h-7 items-center gap-2.25 px-2">
      <Skeleton className="size-4" />
      <Skeleton className="h-2.5 w-24" />
    </div>
  ));
}

/** Stands in for the whole sidebar when it fails to render, so that the rest of the app stays usable. */
export function SidebarCrash({ reset }: ErrorComponentProps) {
  return (
    <div className="px-2.5 pt-13">
      <SidebarError message={fr.sidebar.crash} onRetry={reset} />
    </div>
  );
}
