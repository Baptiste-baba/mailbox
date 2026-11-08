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
  marker?: 'accent' | 'danger' | undefined;
  disabled?: boolean;
}

const markerClassNames: Record<NonNullable<NavItemProps['marker']>, string> = {
  accent: 'bg-klein',
  danger: 'bg-verm',
};

/**
 * An entry of a navigation list. It marks itself as the current page from `aria-current`, which the
 * router sets on the active link. Disabled, it is no longer a link at all. In a container narrower
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
        'group flex min-h-7 gap-2.25 rounded-sm px-2 py-1.25 text-base text-ink touch:min-h-11',
        description === undefined ? 'items-center' : 'items-start',
        '@max-rail:items-center @max-rail:justify-center @max-rail:px-0',
        'aria-disabled:cursor-not-allowed aria-disabled:opacity-55',
        'not-aria-disabled:not-aria-[current=page]:hover:bg-mist2',
        'aria-[current=page]:bg-kleinbg aria-[current=page]:font-semibold aria-[current=page]:text-kleintx',
        className,
      )}
      {...props}
    >
      <span className="relative grid h-4.5 w-4 flex-none place-items-center text-ink2 group-aria-[current=page]:text-klein [&>svg]:icon-16">
        {icon}
        {marker !== undefined && (
          <span
            aria-hidden="true"
            className={`absolute -top-0.5 -right-1 hidden size-1.5 rounded-full @max-rail:block ${markerClassNames[marker]}`}
          />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col @max-rail:sr-only">
        <span className="truncate">{label}</span>
        {description !== undefined && (
          <span className="truncate text-micro font-normal text-ink3">{description}</span>
        )}
      </span>
      {trailing !== undefined && (
        <span className="flex-none text-meta text-ink3 group-aria-[current=page]:text-kleintx @max-rail:hidden">
          {trailing}
        </span>
      )}
    </a>
  );
}
