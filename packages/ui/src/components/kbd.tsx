import type { ComponentProps } from 'react';
import { joinClassNames } from '../join-class-names.ts';

type KbdSurface = 'plain' | 'accent';

const surfaceClassNames: Record<KbdSurface, string> = {
  plain: 'border-line bg-chrome text-ink-2',
  accent: 'border-transparent bg-on-primary/20 text-on-primary',
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
        'inline-block min-w-4.5 rounded-sm border px-1.5 text-center font-sans text-micro leading-4 font-medium',
        surfaceClassNames[surface],
        className,
      )}
      {...props}
    />
  );
}
