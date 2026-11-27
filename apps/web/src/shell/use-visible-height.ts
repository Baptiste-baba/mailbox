import { useLayoutEffect } from 'react';

/** Less room than this under the visible area is a browser bar, not a keyboard. */
const KEYBOARD_MIN_HEIGHT = 150;

/**
 * Keeps the frame of the app on the part of the screen the keyboard leaves: `--visible-height` its
 * height, `--visible-top` how far iOS has slid the page up to show the cursor, which the frame
 * follows back down. Safari on the iPhone lays the page out as if the keyboard were not there.
 * `data-keyboard` marks the page while the keyboard is open.
 */
export function useVisibleHeight(): void {
  useLayoutEffect(() => {
    const viewport = window.visualViewport;
    if (viewport === null) {
      return;
    }
    const root = document.documentElement;
    // The tallest visible area seen in this width: the screen without the keyboard.
    let fullHeight = 0;
    let width = window.innerWidth;
    const fit = () => {
      if (window.innerWidth !== width) {
        width = window.innerWidth;
        fullHeight = 0;
      }
      // Zooming in shrinks and moves the visible area too, but the page should keep its place then.
      const zoomed = viewport.scale > 1;
      const visible = viewport.height * viewport.scale;
      fullHeight = Math.max(fullHeight, visible);
      root.style.setProperty('--visible-height', `${visible}px`);
      root.style.setProperty('--visible-top', `${zoomed ? 0 : viewport.offsetTop}px`);
      root.toggleAttribute('data-keyboard', visible < fullHeight - KEYBOARD_MIN_HEIGHT);
    };
    fit();
    viewport.addEventListener('resize', fit);
    viewport.addEventListener('scroll', fit);
    return () => {
      viewport.removeEventListener('resize', fit);
      viewport.removeEventListener('scroll', fit);
      root.style.removeProperty('--visible-height');
      root.style.removeProperty('--visible-top');
      root.removeAttribute('data-keyboard');
    };
  }, []);
}
