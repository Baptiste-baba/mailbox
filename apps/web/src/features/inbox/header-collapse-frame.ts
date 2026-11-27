/** How far the list scrolls while its header turns into bubbles. */
export const COLLAPSE_DISTANCE = 96;

/** Size of the title at rest, then once in its bubble. */
export const REST_TITLE_SIZE = 26;
export const BUBBLE_TITLE_SIZE = 16;

/** Past this share of the way, the bubbles are the header: they take the touch and the keyboard. */
export const COLLAPSED_FROM = 0.6;

/** 0 → 1 over a stretch of the way, from `start` to `end`, easing in and out. */
export function stretch(progress: number, start: number, end: number): number {
  const t = Math.min(1, Math.max(0, (progress - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

/**
 * Where each part of the header stands at a point of the way, from 0 (the header at rest) to 1
 * (the bubbles). Each part moves over its own stretch, so that one leaves as the other comes.
 */
export interface CollapseFrame {
  /** The title shrinking into its bubble. */
  shrink: number;
  /** "7 non lus" fading out, then "7" fading in inside the bubble. */
  chipOut: number;
  badgeIn: number;
  bubbleIn: number;
  /** The filter turning from tabs into a floating pill. */
  segmentIn: number;
  tabsOut: number;
  searchOut: number;
}

/** The parts of the header at `progress`; without motion, the title jumps half way instead. */
export function collapseFrame(progress: number, reducedMotion: boolean): CollapseFrame {
  return {
    shrink: reducedMotion ? Number(progress >= 0.5) : stretch(progress, 0, 0.85),
    chipOut: stretch(progress, 0.1, 0.55),
    badgeIn: stretch(progress, 0.5, 1),
    bubbleIn: stretch(progress, 0.35, 1),
    segmentIn: stretch(progress, 0.45, 1),
    tabsOut: stretch(progress, 0, 0.5),
    searchOut: stretch(progress, 0.3, 0.9),
  };
}
