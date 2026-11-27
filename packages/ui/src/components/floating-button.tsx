import type { ComponentProps, ReactNode } from 'react';
import { joinClassNames } from '../join-class-names.ts';
import { pressableClassNames } from '../pressable-class-names.ts';

interface FloatingButtonProps extends ComponentProps<'button'> {
  icon: ReactNode;
}

/**
 * The main action of a phone screen, floating at its bottom right over what scrolls beneath, clear
 * of the home bar. Its parent must be positioned. Its type defaults to `button`.
 */
export function FloatingButton({
  icon,
  type = 'button',
  className,
  children,
  ...props
}: FloatingButtonProps) {
  return (
    <button
      type={type}
      className={joinClassNames(
        'absolute right-4 bottom-[calc(--spacing(4)+env(safe-area-inset-bottom))] z-10 inline-flex h-14 items-center gap-2.5 rounded-xl bg-primary pr-5.5 pl-4.5 font-medium text-body text-on-primary shadow-float available:hover:bg-primary-hover [&>svg]:icon-20',
        pressableClassNames,
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
