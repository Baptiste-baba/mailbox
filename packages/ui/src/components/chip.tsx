import type { ReactNode } from 'react';
import { joinClassNames } from '../join-class-names.ts';

type ChipTone = 'tint' | 'warn';

const toneClassNames: Record<ChipTone, string> = {
  tint: 'bg-tint text-tint-ink',
  warn: 'bg-warn-tint text-warn',
};

type ChipSize = 'md' | 'sm';

const sizeClassNames: Record<ChipSize, string> = {
  md: 'h-6 px-2.25',
  sm: 'h-5 px-2',
};

interface ChipProps {
  tone: ChipTone;
  /** `sm` inside a dense block, such as a card of a list. */
  size?: ChipSize;
  children: ReactNode;
  className?: string;
}

/** A short status on a rounded pill, such as "Reconnecter" or "7 non lus". */
export function Chip({ tone, size = 'md', children, className }: ChipProps) {
  return (
    <span
      className={joinClassNames(
        'inline-flex flex-none items-center gap-1.25 rounded-full text-caption font-medium whitespace-nowrap',
        sizeClassNames[size],
        toneClassNames[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
