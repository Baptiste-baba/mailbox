import {
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  useLayoutEffect,
  useRef,
} from 'react';
import { floatingSurfaceClassNames } from '../floating-surface-class-names.ts';
import { joinClassNames } from '../join-class-names.ts';

interface ToolbarProps {
  /** What the controls act on, read aloud, such as "Mise en forme". */
  label: string;
  children: ReactNode;
  /** Lifted above the page, as over the text it acts on. */
  floating?: boolean;
  className?: string;
}

/** Where each key moves the focus among `count` controls, from the one at `index`. */
function targetIndex(key: string, index: number, count: number): number | undefined {
  switch (key) {
    case 'ArrowRight':
      return (index + 1) % count;
    case 'ArrowLeft':
      return (index - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return undefined;
  }
}

/** The controls of the toolbar itself, not those of a menu one of them opens. */
function controlsOf(toolbar: HTMLElement | null): HTMLElement[] {
  return toolbar === null
    ? []
    : [...toolbar.querySelectorAll<HTMLElement>('button:enabled:not([popover] button)')];
}

/** Lets `current` alone, among the controls, take Tab. */
function setTabStop(controls: HTMLElement[], current: HTMLElement | undefined) {
  for (const control of controls) {
    control.tabIndex = control === current ? 0 : -1;
  }
}

/**
 * A row of controls acting on one thing, such as the text being written. Tab enters it once, on
 * the control used last; the arrows then move between its controls, Home and End to its ends.
 */
export function Toolbar({ label, children, floating = false, className }: ToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLElement | null>(null);
  // After every render, as controls may come and go: one of them, and only one, takes Tab.
  useLayoutEffect(() => {
    const controls = controlsOf(toolbarRef.current);
    setTabStop(controls, controls.find((control) => control === currentRef.current) ?? controls[0]);
  });
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const controls = controlsOf(toolbarRef.current);
    const focused = controls.find((control) => control === event.target);
    if (focused !== undefined) {
      currentRef.current = focused;
      setTabStop(controls, focused);
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const controls = controlsOf(toolbarRef.current);
    const index = event.target instanceof HTMLElement ? controls.indexOf(event.target) : -1;
    const target = index === -1 ? undefined : targetIndex(event.key, index, controls.length);
    if (target !== undefined) {
      event.preventDefault();
      controls[target]?.focus();
    }
  };
  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label={label}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      className={joinClassNames(
        'flex flex-wrap items-center gap-0.5',
        floating ? joinClassNames('p-1', floatingSurfaceClassNames) : undefined,
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Controls that belong together: a toolbar too narrow for all its controls wraps between groups. */
export function ToolbarGroup({ children }: { children: ReactNode }) {
  return <span className="flex items-center gap-0.5">{children}</span>;
}

/** A thin line between groups of controls in a toolbar. */
export function ToolbarSeparator() {
  return <hr aria-orientation="vertical" className="mx-1 h-5 w-px border-0 bg-line" />;
}
