import { Chip, SegmentedControl } from '@mailbox/ui';
import { fr } from '../../i18n/fr.ts';
import { MenuButton } from '../../shell/menu-button.tsx';
import { type UnreadFilter, unreadFilterOptions } from './unread-filter.ts';
import type { HeaderParts } from './use-header-collapse.ts';

interface CollapsingTitleProps {
  title: string;
  unreadCount: number | undefined;
  filter: UnreadFilter;
  onChoose: (filter: UnreadFilter) => void;
  parts: HeaderParts;
  /** The list has scrolled: the bubbles are the header. */
  collapsed: boolean;
  onBackToTop: () => void;
}

/**
 * The top of the list on a phone, above what scrolls: ☰ and the title of the view at rest, then
 * three bubbles floating over the list once it scrolls: ☰, the title with its unread count, which
 * brings the list back to its top, and the filter. `useHeaderCollapse` moves every part.
 */
export function CollapsingTitle({
  title,
  unreadCount,
  filter,
  onChoose,
  parts,
  collapsed,
  onBackToTop,
}: CollapsingTitleProps) {
  const unread = unreadCount !== undefined && unreadCount > 0 ? unreadCount : undefined;
  const touchable = collapsed ? 'pointer-events-auto' : 'pointer-events-none';
  return (
    // Touches pass through to the list, except on the controls.
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-2 pt-screen-2">
      <div className="relative h-11">
        <div className="pointer-events-auto absolute top-0 left-0">
          <MenuButton />
        </div>
        <button
          ref={parts.bubble}
          type="button"
          aria-label={fr.inbox.backToTop}
          inert={!collapsed}
          onClick={onBackToTop}
          className={`absolute top-0 left-13 h-11 origin-left rounded-full border border-line bg-surface opacity-0 shadow-bubble ${touchable}`}
        />
        <h1
          ref={parts.title}
          className="absolute top-1/2 left-13.5 max-w-[calc(100%-9rem)] origin-left -translate-y-1/2 truncate text-subject font-semibold text-heading"
        >
          {title}
        </h1>
        {unread !== undefined && (
          <>
            <span ref={parts.chip} className="absolute top-1/2 left-13.5 -translate-y-1/2">
              <Chip tone="tint">{fr.common.unreadCount(unread)}</Chip>
            </span>
            {/* The chip says the same to screen readers. */}
            <span
              ref={parts.badge}
              aria-hidden="true"
              className="absolute top-1/2 left-13.5 grid h-5.5 min-w-5.5 -translate-y-1/2 place-items-center rounded-full bg-tint px-1.75 text-micro font-semibold text-tint-ink opacity-0"
            >
              {unread}
            </span>
          </>
        )}
        <div
          ref={parts.segment}
          inert={!collapsed}
          className={`absolute top-0 right-0 opacity-0 ${touchable}`}
        >
          <SegmentedControl
            variant="pill"
            label={fr.inbox.filterLabel}
            options={unreadFilterOptions}
            value={filter}
            onChange={onChoose}
          />
        </div>
      </div>
    </div>
  );
}
