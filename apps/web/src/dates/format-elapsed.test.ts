import { describe, expect, it } from 'vitest';
import { formatElapsed } from './format-elapsed.ts';

const now = new Date('2026-11-27T14:00:00.000Z');
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

// The browser puts a no-break space, wide or narrow depending on the unit, before the unit.
describe('formatElapsed', () => {
  it.each([
    [0, '1 min'],
    [25, '25 min'],
    [59, '59 min'],
    [60, '1 h'],
    [36 * 60, '36 h'],
    [48 * 60, '2 j'],
    [5 * 24 * 60 + 300, '5 j'],
  ])('tells %i minutes as %s', (minutes, told) => {
    expect(formatElapsed(ago(minutes), now).replace(/\s/g, ' ')).toBe(told);
  });
});
