import { describe, expect, test } from 'vitest';
import { collapseFrame, stretch } from './header-collapse-frame.ts';

describe('header collapse frame', () => {
  test('holds the header at rest at the top, and the bubbles once the way is gone', () => {
    expect(collapseFrame(0, false)).toEqual({
      shrink: 0,
      chipOut: 0,
      badgeIn: 0,
      bubbleIn: 0,
      segmentIn: 0,
      tabsOut: 0,
      searchOut: 0,
    });
    expect(Object.values(collapseFrame(1, false)).every((value) => value === 1)).toBe(true);
  });

  test('lets the tabs leave before the pill comes, and the chip before the badge', () => {
    const halfway = collapseFrame(0.5, false);

    expect(halfway.tabsOut).toBe(1);
    expect(halfway.segmentIn).toBeLessThan(0.1);
    expect(halfway.chipOut).toBeGreaterThan(0.9);
    expect(halfway.badgeIn).toBe(0);
  });

  test('without motion, keeps the title at its size until half way, then shrinks it at once', () => {
    expect(collapseFrame(0.49, true).shrink).toBe(0);
    expect(collapseFrame(0.5, true).shrink).toBe(1);
  });

  test('eases a stretch in and out, and holds outside it', () => {
    expect(stretch(0.2, 0.3, 0.9)).toBe(0);
    expect(stretch(0.6, 0.3, 0.9)).toBeCloseTo(0.5);
    expect(stretch(1, 0.3, 0.9)).toBe(1);
  });
});
