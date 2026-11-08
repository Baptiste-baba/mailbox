import { describe, expect, test } from 'vitest';
import { formatListDate } from './format-list-date.ts';

// Sunday 8 November 2026, 11:00 in Paris.
const now = new Date('2026-11-08T10:00:00Z');
const paris = 'Europe/Paris';

describe('formatListDate', () => {
  test('gives the time for today, in the user’s time zone', () => {
    expect(formatListDate('2026-11-08T07:47:00Z', now, paris)).toBe('08:47');
    expect(formatListDate('2026-11-07T23:30:00Z', now, paris)).toBe('00:30');
  });

  test('says "hier" for yesterday', () => {
    expect(formatListDate('2026-11-07T17:42:00Z', now, paris)).toBe('hier');
  });

  test('gives the day of the week within the week', () => {
    expect(formatListDate('2026-11-05T09:00:00Z', now, paris)).toBe('jeu.');
  });

  test('gives the day and month this year, and the year before', () => {
    expect(formatListDate('2026-10-14T09:00:00Z', now, paris)).toBe('14 oct.');
    expect(formatListDate('2025-10-14T09:00:00Z', now, paris)).toBe('14 oct. 2025');
  });
});
