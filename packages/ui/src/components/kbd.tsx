import type { ComponentProps } from 'react';
import { joinClassNames } from '../join-class-names.ts';

type KbdSurface = 'plain' | 'accent';

const surfaceClassNames: Record<KbdSurface, string> = {
  plain: 'text-ink-2 border border-line',
  accent: 'bg-on-primary/20 text-on-primary',
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
        'inline-block min-w-4.5 rounded-sm px-1 text-center font-sans text-micro leading-4.25',
        surfaceClassNames[surface],
        className,
      )}
      {...props}
    />
  );
}
