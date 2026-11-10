import type { ComponentProps } from 'react';
import { joinClassNames } from '../join-class-names.ts';

/**
 * A row of a list that opens what it stands for. The current one, marked by `aria-current` that the
 * router sets on the active link, is tinted.
 */
export function RowLink({ className, ...props }: ComponentProps<'a'>) {
  return (
    <a
      className={joinClassNames(
        'flex gap-3.5 rounded-lg px-3 py-3.5',
        'not-aria-[current=page]:hover:bg-page aria-[current=page]:bg-selected',
        className,
      )}
      {...props}
    />
  );
}
