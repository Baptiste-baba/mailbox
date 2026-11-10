import type { ReactNode } from 'react';

interface FileChipProps {
  /** The icon of the kind of file. */
  icon: ReactNode;
  name: string;
  /** Kind and size, such as "PDF, 214 ko". */
  details: string;
}

/** A file attached to something, by its name, kind and size. */
export function FileChip({ icon, name, details }: FileChipProps) {
  return (
    <div className="inline-flex h-11 max-w-full items-center gap-2.5 rounded-md border border-line bg-surface px-3.5">
      <span className="flex-none text-danger [&>svg]:icon-18">{icon}</span>
      <span className="truncate text-small font-medium">{name}</span>
      <span className="flex-none text-caption text-ink-2">{details}</span>
    </div>
  );
}
