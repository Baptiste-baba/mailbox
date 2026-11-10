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
    <div className="inline-flex max-w-full items-center gap-2.5 rounded-md border border-line bg-surface py-2 pr-3 pl-2.5">
      <span className="flex-none text-danger [&>svg]:icon-18">{icon}</span>
      <span className="truncate font-medium">{name}</span>
      <span className="flex-none text-caption text-ink-2">{details}</span>
    </div>
  );
}
