import { Button, Skeleton } from '@mailbox/ui';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { fr } from '../i18n/fr.ts';

interface SidebarErrorProps {
  message: string;
  onRetry: () => void;
}

/** What a part of the sidebar shows when its data could not be loaded. */
export function SidebarError({ message, onRetry }: SidebarErrorProps) {
  return (
    <div className="flex flex-col items-start gap-1 px-2 py-1 text-meta text-ink3">
      <p>{message}</p>
      <Button variant="text" size="xs" onClick={onRetry} className="-ml-1.5">
        {fr.common.retry}
      </Button>
    </div>
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
    <div className="w-57 flex-none bg-mist px-2.5 pt-13 shadow-hairline-end">
      <SidebarError message={fr.sidebar.crash} onRetry={reset} />
    </div>
  );
}
