import type { ComponentProps } from 'react';
import { joinClassNames } from '../join-class-names.ts';

/** A raised surface with its border, such as the card of the open thread. */
export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={joinClassNames('rounded-xl border border-line bg-surface shadow-card', className)}
      {...props}
    />
  );
}
