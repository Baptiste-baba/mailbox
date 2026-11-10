import type { ColumnHandle } from '@mailbox/ui';
import { type RefObject, useEffect, useRef } from 'react';

/** Below this width the sidebar, the list and the thread no longer fit side by side at full size. */
const NARROW_WINDOW = '(max-width: 1139px)';

/** Share of the window the sidebar takes until the user resizes it: 272 px of a 1440 px window. */
export const SIDEBAR_DEFAULT_SIZE = '19%';

/**
 * Folds the sidebar to its icons while the window is too narrow, and gives it back the share of the
 * window it had once there is room again, unless the user folded it themselves. Returns the
 * `onResize` handler of the sidebar column.
 */
export function useCollapseOnNarrowWindow(
  sidebar: RefObject<ColumnHandle | null>,
): (size: { asPercentage: number }) => void {
  // Recorded while the window is wide: once narrow, the sidebar is already squeezed to its minimum.
  const wideShare = useRef<number | undefined>(undefined);
  useEffect(() => {
    const narrow = window.matchMedia(NARROW_WINDOW);
    let foldedByWindow = false;
    const fit = () => {
      const panel = sidebar.current;
      if (panel === null) {
        return;
      }
      if (narrow.matches && !panel.isCollapsed()) {
        panel.collapse();
        foldedByWindow = true;
      } else if (!narrow.matches && foldedByWindow) {
        panel.resize(
          wideShare.current === undefined ? SIDEBAR_DEFAULT_SIZE : `${wideShare.current}%`,
        );
        foldedByWindow = false;
      }
    };
    fit();
    narrow.addEventListener('change', fit);
    return () => narrow.removeEventListener('change', fit);
  }, [sidebar]);
  return (size) => {
    if (!window.matchMedia(NARROW_WINDOW).matches && sidebar.current?.isCollapsed() === false) {
      wideShare.current = size.asPercentage;
    }
  };
}
