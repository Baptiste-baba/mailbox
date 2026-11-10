import type { ComponentProps } from 'react';
import { joinClassNames } from '../join-class-names.ts';
import { pressableClassNames } from '../pressable-class-names.ts';

type IconButtonVariant = 'neutral' | 'danger';

// A toggle that is on takes the selection colours, as the active item of a list does.
const variantClassNames: Record<IconButtonVariant, string> = {
  neutral:
    'text-ink-2 enabled:not-aria-pressed:hover:bg-field enabled:not-aria-pressed:hover:text-ink aria-pressed:bg-tint aria-pressed:text-link',
  danger: 'text-danger enabled:hover:bg-danger-tint',
};

interface IconButtonProps
  extends Omit<ComponentProps<'button'>, 'aria-label' | 'aria-pressed' | 'title'> {
  /** What the button does: its accessible name, also shown on hover. */
  label: string;
  /** Keyboard shortcut added to the hover hint, such as E. */
  shortcut?: string | undefined;
  /** Turns the button into a toggle, on or off. */
  pressed?: boolean;
  variant?: IconButtonVariant;
}

/** A button showing only an icon, given as its child. Its type defaults to `button`. */
export function IconButton({
  label,
  shortcut,
  pressed,
  variant = 'neutral',
  type = 'button',
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      aria-pressed={pressed}
      title={shortcut === undefined ? label : `${label} (${shortcut})`}
      className={joinClassNames(
        'grid h-7 w-7.5 flex-none place-items-center rounded-md touch:size-11 [&>svg]:icon-16',
        pressableClassNames,
        variantClassNames[variant],
        className,
      )}
      {...props}
    />
  );
}
