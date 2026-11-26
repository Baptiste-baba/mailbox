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
  /**
   * A control of its own at the end of the item, such as a link to what settles its status. It
   * sits beside the link, a link holding no other control, and hides with the label.
   */
  action?: ReactNode;
  /** Dot on the icon once the item is reduced to it, standing for what its trailing content said. */
  marker?: 'accent' | 'warn' | undefined;
}

const markerClassNames: Record<NonNullable<NavItemProps['marker']>, string> = {
  accent: 'bg-primary',
  warn: 'bg-warn',
};

/**
 * An entry of a navigation list. It marks itself as the current page from `aria-current`, which the
 * router sets on the active link. Without `href`, it is not a link: marked `aria-disabled`, it keeps
 * its look and its hint says why. In a container narrower than `rail`, it shrinks to its icon and
 * keeps its label for screen readers only.
 */
export function NavItem({ action, ...link }: NavItemProps) {
  if (action === undefined) {
    return <NavItemLink {...link} />;
  }
  const twoLines = link.description !== undefined;
  return (
    // The background of the link goes on to its action: both read as one item.
    <div className="flex rounded-md not-has-[[aria-current=page]]:hover:bg-page has-[[aria-current=page]]:bg-field">
      <NavItemLink {...link} className={joinClassNames('min-w-0 flex-1', link.className)} />
      <span
        className={joinClassNames(
          'flex flex-none items-center pr-3 @max-rail:hidden',
          twoLines ? 'mt-2 self-start' : 'self-center',
          firstLineHeight(twoLines),
        )}
      >
        {action}
      </span>
    </div>
  );
}

/** The height of the first line of the label: what stands beside the label sits level with it. */
function firstLineHeight(twoLines: boolean): string {
  return twoLines ? 'h-5' : 'h-5.5';
}

function NavItemLink({
  icon,
  label,
  description,
  trailing,
  marker,
  className,
  ...props
}: Omit<NavItemProps, 'action'>) {
  const twoLines = description !== undefined;
  return (
    <a
      className={joinClassNames(
        'group flex min-h-10 gap-3 rounded-md px-3 text-base text-ink touch:min-h-11',
        twoLines ? 'items-start py-2' : 'items-center',
        '@max-rail:items-center @max-rail:justify-center @max-rail:px-0 @max-rail:py-0',
        'available:not-aria-[current=page]:hover:bg-page',
        'aria-[current=page]:bg-field aria-[current=page]:font-medium',
        className,
      )}
      {...props}
    >
      <span
        className={joinClassNames(
          'relative grid w-4.5 flex-none place-items-center text-ink-2 group-aria-[current=page]:text-ink [&>svg]:icon-18',
          firstLineHeight(twoLines),
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
        <span className={twoLines ? 'truncate leading-5' : 'truncate'}>{label}</span>
        {twoLines && (
          <span className="truncate text-caption font-normal text-ink-2">{description}</span>
        )}
      </span>
      {trailing !== undefined && (
        <span
          className={joinClassNames(
            'flex flex-none items-center text-caption text-ink-2 group-aria-[current=page]:font-semibold group-aria-[current=page]:text-link @max-rail:hidden',
            firstLineHeight(twoLines),
          )}
        >
          {trailing}
        </span>
      )}
    </a>
  );
}
