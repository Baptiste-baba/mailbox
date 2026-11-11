import type { ComponentProps } from 'react';
import { joinClassNames } from '../join-class-names.ts';

/**
 * A text input with no frame of its own, for a place that draws one and shows its focus, such as a
 * field line.
 */
export function BareInput({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={joinClassNames(
        'h-7 min-w-0 bg-transparent text-body text-ink outline-none placeholder:text-ink-2',
        className,
      )}
      {...props}
    />
  );
}
