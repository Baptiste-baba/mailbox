import type { ComponentProps, ReactNode } from 'react';
import { joinClassNames } from '../join-class-names.ts';
import { pressableClassNames } from '../pressable-class-names.ts';
import { Kbd } from './kbd.tsx';

interface BarButtonProps extends ComponentProps<'button'> {
  icon: ReactNode;
  shortcut?: string | undefined;
}

/**
 * A wide button set into a surface, that opens a larger action such as replying: it looks like the
 * field where that action will happen. Its type defaults to `button`.
 */
export function BarButton({
  icon,
  shortcut,
  type = 'button',
  className,
  children,
  ...props
}: BarButtonProps) {
  return (
    <button
      type={type}
      className={joinClassNames(
        'flex h-11 w-full items-center gap-2.5 rounded-lg bg-well pr-2 pl-3.5 text-left text-ink2 shadow-hairline enabled:hover:text-ink [&>svg]:icon-15',
        pressableClassNames,
        className,
      )}
      {...props}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut !== undefined && <Kbd aria-hidden="true">{shortcut}</Kbd>}
    </button>
  );
}
