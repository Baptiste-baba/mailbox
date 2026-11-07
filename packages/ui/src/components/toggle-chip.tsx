import type { ComponentProps } from 'react';
import { joinClassNames } from '../join-class-names.ts';
import { pressableClassNames } from '../pressable-class-names.ts';

type ToggleChipVariant = 'plain' | 'gradient';

// Off, the chip is an outline; on, it is filled. The handoff showed no "on" state for the gradient.
const variantClassNames: Record<ToggleChipVariant, string> = {
  plain:
    'text-ink2 not-aria-pressed:shadow-hairline enabled:not-aria-pressed:hover:text-ink aria-pressed:bg-klein aria-pressed:text-onk',
  gradient:
    'ai-ring text-klein enabled:not-aria-pressed:hover:text-kleintx aria-pressed:bg-linear-to-r/srgb aria-pressed:from-g1 aria-pressed:to-g-fill-end aria-pressed:text-onk',
};

interface ToggleChipProps extends Omit<ComponentProps<'button'>, 'aria-pressed'> {
  pressed: boolean;
  variant?: ToggleChipVariant;
}

/** A small toggle with a short label, such as the switch to a search by AI. Its type defaults to `button`. */
export function ToggleChip({
  pressed,
  variant = 'plain',
  type = 'button',
  className,
  ...props
}: ToggleChipProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={joinClassNames(
        'h-5 flex-none rounded-xs px-1.5 text-micro font-semibold touch:h-11 touch:px-3',
        pressableClassNames,
        variantClassNames[variant],
        className,
      )}
      {...props}
    />
  );
}
