import type { ComponentProps } from 'react';
import { joinClassNames } from '../join-class-names.ts';
import { pressableClassNames } from '../pressable-class-names.ts';

interface ToggleChipProps extends Omit<ComponentProps<'button'>, 'aria-pressed'> {
  pressed: boolean;
}

/** A small toggle with a short label, such as the switch to a search by AI. Its type defaults to `button`. */
export function ToggleChip({ pressed, type = 'button', className, ...props }: ToggleChipProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={joinClassNames(
        'h-5 flex-none rounded-sm px-1.5 text-caption font-semibold touch:h-11 touch:px-3',
        pressableClassNames,
        // Off, the chip is an outline; on, it is filled. The border stays, transparent, so the chip keeps its size.
        'border border-line text-ink-2 available:not-aria-pressed:hover:text-ink aria-pressed:border-transparent aria-pressed:bg-primary aria-pressed:text-on-primary',
        className,
      )}
      {...props}
    />
  );
}
