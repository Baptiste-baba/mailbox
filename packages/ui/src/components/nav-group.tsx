import type { ComponentProps, ReactNode } from 'react';
import { joinClassNames } from '../join-class-names.ts';
import { pressableClassNames } from '../pressable-class-names.ts';

interface NavGroupProps {
  /** Heading of the group; a group without one is just set apart from the others. */
  title?: string;
  /** A small action at the end of the heading, a `NavGroupAction`. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * A set of navigation items under an optional heading, which screen readers can jump between. In a
 * container narrower than `rail`, a hairline replaces the heading on screen.
 */
export function NavGroup({ title, action, children, className }: NavGroupProps) {
  return (
    <div
      className={joinClassNames(
        'flex flex-col',
        title === undefined
          ? undefined
          : '@max-rail:mt-3 @max-rail:border-t @max-rail:border-line @max-rail:pt-3',
        className,
      )}
    >
      {title !== undefined && (
        <div className="flex items-center gap-1.5 px-3 pt-5.5 pb-2 @max-rail:sr-only">
          <h2 className="text-caption leading-none font-medium text-ink-2">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/** The action of a navigation group heading, such as "Gérer". Its type defaults to `button`. */
export function NavGroupAction({ type = 'button', ...props }: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={joinClassNames(
        'ml-auto text-caption leading-none font-medium text-link available:hover:underline @max-rail:hidden',
        pressableClassNames,
      )}
      {...props}
    />
  );
}
