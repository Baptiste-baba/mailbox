import { useSyncExternalStore } from 'react';

/**
 * How the app arranges itself in the window: one screen at a time (`phone`), the list beside the
 * open mail without the sidebar (`landscape`, a phone turned sideways), or every column (`desktop`).
 * The size of the window decides, never the kind of device.
 */
export type Layout = 'phone' | 'landscape' | 'desktop';

// Narrower than a tablet held upright.
const PHONE_WINDOW = '(width < 768px)';
// Too short for the sidebar and its columns, wide enough for the list and the mail side by side.
const LANDSCAPE_WINDOW = '(width >= 768px) and (height < 500px)';

function currentLayout(): Layout {
  if (window.matchMedia(PHONE_WINDOW).matches) {
    return 'phone';
  }
  return window.matchMedia(LANDSCAPE_WINDOW).matches ? 'landscape' : 'desktop';
}

function onLayoutChange(onChange: () => void): () => void {
  const windows = [PHONE_WINDOW, LANDSCAPE_WINDOW].map((query) => window.matchMedia(query));
  for (const query of windows) {
    query.addEventListener('change', onChange);
  }
  return () => {
    for (const query of windows) {
      query.removeEventListener('change', onChange);
    }
  };
}

/** The layout for the current size of the window, following it as the window turns or resizes. */
export function useLayout(): Layout {
  return useSyncExternalStore(onLayoutChange, currentLayout);
}
