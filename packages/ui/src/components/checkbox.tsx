import type { ComponentProps, ReactNode } from 'react';
import { joinClassNames } from '../join-class-names.ts';

interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type' | 'className' | 'children'> {
  /** What ticking the box means; clicking it ticks the box too. */
  label: ReactNode;
  className?: string;
}

/** A check box with its label: the browser's own box, in the colour of the selection. */
export function Checkbox({ label, className, ...inputProps }: CheckboxProps) {
  return (
    <label
      className={joinClassNames(
        'inline-flex items-start gap-2.5 text-base text-ink has-disabled:cursor-not-allowed has-disabled:opacity-55 touch:min-h-11 touch:items-center',
        className,
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 size-4.5 flex-none accent-primary disabled:cursor-not-allowed touch:mt-0 touch:size-5"
        {...inputProps}
      />
      <span>{label}</span>
    </label>
  );
}
