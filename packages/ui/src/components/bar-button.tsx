import type { ComponentProps, ReactNode } from 'react';
import { joinClassNames } from '../join-class-names.ts';
import { pressableClassNames } from '../pressable-class-names.ts';

interface BarButtonProps extends ComponentProps<'button'> {
  icon: ReactNode;
}

/**
 * A wide button that opens a larger action such as replying: it looks like the field where that
 * action will happen. Its type defaults to `button`.
 */
export function BarButton({
  icon,
  type = 'button',
  className,
  children,
  ...props
}: BarButtonProps) {
  return (
    <button
      type={type}
      className={joinClassNames(
        'flex h-11 min-w-0 items-center gap-2.5 rounded-md bg-field px-3.5 text-left text-ink-2 available:hover:text-ink [&>svg]:icon-18',
        pressableClassNames,
        className,
      )}
      {...props}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}
