import type { ComponentProps } from 'react';
import { joinClassNames } from '../join-class-names.ts';

/** The raised surface of a mail: the design keeps cards for mail and nothing else. */
export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={joinClassNames('rounded-card bg-raise shadow-card', className)} {...props} />
  );
}
