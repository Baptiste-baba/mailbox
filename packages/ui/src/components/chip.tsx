import type { ReactNode } from 'react';
import { joinClassNames } from '../join-class-names.ts';

type ChipTone = 'warn';

const toneClassNames: Record<ChipTone, string> = {
  warn: 'bg-warn-tint text-warn',
};

interface ChipProps {
  tone: ChipTone;
  children: ReactNode;
  className?: string;
}

/** A short status on a rounded pill, such as "Reconnecter". */
export function Chip({ tone, children, className }: ChipProps) {
  return (
    <span
      className={joinClassNames(
        'inline-flex h-6 flex-none items-center gap-1.25 rounded-full px-2.25 text-caption font-medium whitespace-nowrap',
        toneClassNames[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
