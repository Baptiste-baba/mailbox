import type { ReactNode } from 'react';
import { joinClassNames } from '../join-class-names.ts';

interface PaneHeaderProps {
  children: ReactNode;
  className?: string;
}

/** The bar at the top of a column: its title and its actions, above a hairline. */
export function PaneHeader({ children, className }: PaneHeaderProps) {
  return (
    <header
      className={joinClassNames(
        'flex h-13 flex-none items-center gap-1 px-3.5 border-b border-line',
        className,
      )}
    >
      {children}
    </header>
  );
}
