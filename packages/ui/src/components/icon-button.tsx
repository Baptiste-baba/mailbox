import type { ComponentProps } from 'react';
import { joinClassNames } from '../join-class-names.ts';
import { pressableClassNames } from '../pressable-class-names.ts';

type IconButtonSize = 'md' | 'sm';

// `sm` sits inside a compact control, such as the steps of a number.
const sizeClassNames: Record<IconButtonSize, string> = {
  md: 'size-10 [&>svg]:icon-18',
  sm: 'size-8 [&>svg]:icon-16',
};

const plainClassNames =
  // A toggle that is on takes the tint.
  'rounded-md text-ink-2 available:not-aria-pressed:hover:bg-field available:not-aria-pressed:hover:text-ink aria-pressed:bg-tint aria-pressed:text-tint-ink';

// A round button raised above the screen, at a finger's size whatever the pointer.
const raisedClassNames =
  'size-11 rounded-full border border-line bg-surface text-ink shadow-soft [&>svg]:icon-20 available:hover:bg-field';

interface IconButtonProps extends Omit<ComponentProps<'button'>, 'aria-label' | 'aria-pressed'> {
  /** What the button does: its accessible name, also shown on hover unless `title` says more. */
  label: string;
  /** Keyboard shortcut added to the hover hint, such as E. */
  shortcut?: string | undefined;
  /** Turns the button into a toggle, on or off. */
  pressed?: boolean;
  size?: IconButtonSize;
  /** Round, bordered and lifted, standing alone at the top of a screen, such as a way back. */
  raised?: boolean;
}

/** A button showing only an icon, given as its child. Its type defaults to `button`. */
export function IconButton({
  label,
  shortcut,
  pressed,
  size = 'md',
  raised = false,
  title = shortcut === undefined ? label : `${label} (${shortcut})`,
  type = 'button',
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      aria-pressed={pressed}
      title={title}
      className={joinClassNames(
        'grid flex-none place-items-center touch:size-11',
        raised ? raisedClassNames : [sizeClassNames[size], plainClassNames].join(' '),
        pressableClassNames,
        className,
      )}
      {...props}
    />
  );
}
