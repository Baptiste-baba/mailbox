import type { ComponentProps } from 'react';
import { joinClassNames } from '../join-class-names.ts';

type KbdSurface = 'plain' | 'accent';

const surfaceClassNames: Record<KbdSurface, string> = {
  plain: 'text-ink3 shadow-hairline',
  accent: 'text-onk shadow-hairline-on-accent',
};

interface KbdProps extends ComponentProps<'kbd'> {
  /** What the key sits on: `accent` inside a primary button. */
  surface?: KbdSurface;
}

/** A keyboard shortcut, such as ⌘K, shown next to the action it triggers. */
export function Kbd({ surface = 'plain', className, ...props }: KbdProps) {
  return (
    <kbd
      className={joinClassNames(
        // Geist like the text around it: the browser would otherwise draw a key in monospace.
        'inline-block min-w-4.5 rounded-2xs px-1 text-center font-sans text-micro leading-4.25',
        surfaceClassNames[surface],
        className,
      )}
      {...props}
    />
  );
}
