import type { ComponentProps } from 'react';
import { joinClassNames } from '../join-class-names.ts';
import { pressableClassNames } from '../pressable-class-names.ts';

interface FloatingButtonProps extends Omit<ComponentProps<'button'>, 'aria-label'> {
  /** What the button does: its accessible name, its icon, given as its child, standing alone. */
  label: string;
}

/**
 * The main action of a phone screen: a round button with its icon, floating at the bottom right
 * over what scrolls beneath, just above the home bar. Its parent must be positioned. Its type
 * defaults to `button`.
 */
export function FloatingButton({
  label,
  type = 'button',
  className,
  ...props
}: FloatingButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={joinClassNames(
        'absolute right-4 bottom-[max(--spacing(4),var(--screen-bottom))] z-10 grid size-15 place-items-center rounded-full bg-primary text-on-primary shadow-float available:hover:bg-primary-hover [&>svg]:icon-24',
        pressableClassNames,
        className,
      )}
      {...props}
    />
  );
}
