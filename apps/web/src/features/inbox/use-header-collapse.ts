import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import {
  BUBBLE_TITLE_SIZE,
  COLLAPSE_DISTANCE,
  COLLAPSED_FROM,
  type CollapseFrame,
  collapseFrame,
  REST_TITLE_SIZE,
} from './header-collapse-frame.ts';

/** From beside ☰ to inside its bubble, the title moves this far to the right. */
const TITLE_SHIFT = 12;
/** Inside the bubble, room before the title and after the badge. */
const BUBBLE_PADDING = 14;
const BADGE_GAP = 8;
const CHIP_GAP = 10;
/** Where the end of a scroll is not told, how long a pause in it waits before the header settles. */
const SETTLE_DELAY = 140;

type Part<Element extends HTMLElement = HTMLElement> = RefObject<Element | null>;

export interface HeaderParts {
  title: Part<HTMLHeadingElement>;
  chip: Part<HTMLSpanElement>;
  badge: Part<HTMLSpanElement>;
  bubble: Part<HTMLButtonElement>;
  segment: Part<HTMLDivElement>;
  tabs: Part<HTMLDivElement>;
  search: Part<HTMLDivElement>;
}

/** The elements of the header that move as the list scrolls. */
export function useHeaderParts(): HeaderParts {
  const title = useRef<HTMLHeadingElement>(null);
  const chip = useRef<HTMLSpanElement>(null);
  const badge = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLButtonElement>(null);
  const segment = useRef<HTMLDivElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLDivElement>(null);
  return useMemo(() => ({ title, chip, badge, bubble, segment, tabs, search }), []);
}

function place(part: Part, transform: string, opacity: number) {
  if (part.current !== null) {
    part.current.style.transform = transform;
    part.current.style.opacity = String(opacity);
  }
}

// Transforms and opacity only, read from widths that do not change while the list scrolls: the
// browser never lays the page out again for a frame.
function paint(parts: HeaderParts, frame: CollapseFrame) {
  const scale = 1 - (1 - BUBBLE_TITLE_SIZE / REST_TITLE_SIZE) * frame.shrink;
  const shift = TITLE_SHIFT * frame.shrink;
  const titleWidth = parts.title.current?.offsetWidth ?? 0;
  const badgeWidth = parts.badge.current?.offsetWidth ?? 0;
  const afterTitle = shift + titleWidth * scale;
  place(parts.title, `translateX(${shift}px) scale(${scale})`, 1);
  place(parts.chip, `translateX(${afterTitle + CHIP_GAP}px)`, 1 - frame.chipOut);
  place(parts.badge, `translateX(${afterTitle + BADGE_GAP}px)`, frame.badgeIn);
  const bubbleTitle = (titleWidth * BUBBLE_TITLE_SIZE) / REST_TITLE_SIZE;
  const bubbleWidth =
    BUBBLE_PADDING + bubbleTitle + (badgeWidth > 0 ? BADGE_GAP + badgeWidth : 0) + BUBBLE_PADDING;
  if (parts.bubble.current !== null) {
    parts.bubble.current.style.width = `${bubbleWidth}px`;
  }
  place(parts.bubble, `scaleX(${0.82 + 0.18 * frame.bubbleIn})`, frame.bubbleIn);
  place(parts.segment, `translateY(${(1 - frame.segmentIn) * 14}px)`, frame.segmentIn);
  place(parts.tabs, 'none', 1 - frame.tabsOut);
  place(parts.search, 'none', 1 - frame.searchOut);
}

/** Never half way: between the two states, the header goes on to the nearest. */
function settle(scroller: HTMLElement, reducedMotion: boolean) {
  const top = scroller.scrollTop;
  if (top > 0 && top < COLLAPSE_DISTANCE) {
    scroller.scrollTo({
      top: top < COLLAPSE_DISTANCE / 2 ? 0 : COLLAPSE_DISTANCE,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }
}

/**
 * Turns the header into bubbles as `scroller` scrolls, and back: the scroll drives every step, so
 * that the header follows the finger. `layoutKey` names what changes the widths, such as the
 * title. Returns whether the bubbles are the header now.
 */
export function useHeaderCollapse(
  scroller: HTMLElement | null,
  parts: HeaderParts,
  layoutKey: string,
): boolean {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const progressOf = () =>
      scroller === null ? 0 : Math.min(1, Math.max(0, scroller.scrollTop / COLLAPSE_DISTANCE));
    let frame = 0;
    const render = () => {
      frame = 0;
      const progress = progressOf();
      paint(parts, collapseFrame(progress, reducedMotion.matches));
      setCollapsed(progress > COLLAPSED_FROM);
    };
    render();
    if (scroller === null) {
      return;
    }
    // The end of the scroll, finger lifted and momentum spent, where the browser tells it; a pause
    // in the scroll elsewhere.
    const settleNow = () => settle(scroller, reducedMotion.matches);
    const endsScroll = 'onscrollend' in scroller;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      frame ||= requestAnimationFrame(render);
      if (!endsScroll) {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(settleNow, SETTLE_DELAY);
      }
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    scroller.addEventListener('scrollend', settleNow);
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      scroller.removeEventListener('scrollend', settleNow);
      cancelAnimationFrame(frame);
      clearTimeout(settleTimer);
    };
  }, [scroller, parts, layoutKey]);
  return collapsed;
}
