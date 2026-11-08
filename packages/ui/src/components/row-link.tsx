import type { ComponentProps } from 'react';
import { joinClassNames } from '../join-class-names.ts';

/**
 * A row of a list that opens what it stands for. The current one, marked by `aria-current` that the
 * router sets on the active link, is raised as a card.
 */
export function RowLink({ className, ...props }: ComponentProps<'a'>) {
  return (
    <a
      className={joinClassNames(
        'flex gap-2.5 rounded-lg pt-2.5 pr-3 pb-2.75 pl-2',
        'not-aria-[current=page]:hover:bg-mist aria-[current=page]:bg-raise aria-[current=page]:shadow-cardon',
        className,
      )}
      {...props}
    />
  );
}
