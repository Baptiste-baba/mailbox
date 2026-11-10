import type { ComponentProps, ReactNode } from 'react';
import { joinClassNames } from '../join-class-names.ts';

interface NavItemProps extends ComponentProps<'a'> {
  /** An icon, or a swatch for something the user coloured. */
  icon: ReactNode;
  label: string;
  /** A second, smaller line, such as the address of a mailbox. */
  description?: string;
  /** A count, a keyboard shortcut or a short status, at the end of the item. */
  trailing?: ReactNode;
  /** Dot on the icon once the item is reduced to it, standing for what its trailing content said. */
  marker?: 'accent' | 'warn' | undefined;
  disabled?: boolean;
}

const markerClassNames: Record<NonNullable<NavItemProps['marker']>, string> = {
  accent: 'bg-primary',
  warn: 'bg-warn',
};

/**
 * An entry of a navigation list. It marks itself as the current page from `aria-current`, which the
 * router sets on the active link. Disabled, it is no longer a link at all, but keeps its look: its
 * hint says why. In a container narrower
 * than `rail`, it shrinks to its icon and keeps its label for screen readers only.
 */
export function NavItem({
  icon,
  label,
  description,
  trailing,
  marker,
  disabled = false,
  href,
  className,
  ...props
}: NavItemProps) {
  return (
    <a
      href={disabled ? undefined : href}
      aria-disabled={disabled || undefined}
      className={joinClassNames(
        'group flex min-h-10 gap-3 rounded-md px-3 text-base text-ink touch:min-h-11',
        description === undefined ? 'items-center' : 'items-start py-2',
        '@max-rail:items-center @max-rail:justify-center @max-rail:px-0 @max-rail:py-0',
        'aria-disabled:cursor-not-allowed',
        'not-aria-disabled:not-aria-[current=page]:hover:bg-page',
        'aria-[current=page]:bg-field aria-[current=page]:font-medium',
        className,
      )}
      {...props}
    >
      {/* As high as the first line of the label, so that a dot sits level with the name. */}
      <span
        className={joinClassNames(
          'relative grid w-4.5 flex-none place-items-center text-ink-2 group-aria-[current=page]:text-ink [&>svg]:icon-18',
          description === undefined ? 'h-5.5' : 'h-5',
        )}
      >
        {icon}
        {marker !== undefined && (
          <span
            aria-hidden="true"
            className={`absolute -top-0.5 -right-1 hidden size-1.5 rounded-full @max-rail:block ${markerClassNames[marker]}`}
          />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col @max-rail:sr-only">
        <span className={description === undefined ? 'truncate' : 'truncate leading-5'}>
          {label}
        </span>
        {description !== undefined && (
          <span className="truncate text-caption font-normal text-ink-2">{description}</span>
        )}
      </span>
      {trailing !== undefined && (
        <span
          className={joinClassNames(
            'flex flex-none items-center text-caption text-ink-2 group-aria-[current=page]:font-semibold group-aria-[current=page]:text-link @max-rail:hidden',
            description === undefined ? 'h-5.5' : 'h-5',
          )}
        >
          {trailing}
        </span>
      )}
    </a>
  );
}
