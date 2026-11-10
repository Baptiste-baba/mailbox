import type { ComponentProps } from 'react';
import { joinClassNames } from '../join-class-names.ts';

/**
 * A row of a list that opens what it stands for. The current one, marked by `aria-current` that the
 * router sets on the active link, is framed in blue. Drawn as a small card, set apart from the others.
 */
export function RowLink({ className, ...props }: ComponentProps<'a'>) {
  return (
    <a
      className={joinClassNames(
        'flex gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 shadow-soft',
        // The frame thickens inside the border: the card keeps its size.
        'not-aria-[current=page]:hover:bg-page aria-[current=page]:border-primary aria-[current=page]:ring-1 aria-[current=page]:ring-primary aria-[current=page]:ring-inset',
        className,
      )}
      {...props}
    />
  );
}
