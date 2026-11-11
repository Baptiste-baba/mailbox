import { describe, expect, test } from 'vitest';
import { formatDayPhrase } from './format-day-phrase.ts';

// Sunday 8 November 2026, 11:00 in Paris, the time zone the tests run in (vitest.config.ts).
const now = new Date('2026-11-08T10:00:00Z');

describe('formatDayPhrase', () => {
  test('says "aujourd’hui" for today and "hier" for yesterday, in the user’s time zone', () => {
    expect(formatDayPhrase('2026-11-07T23:30:00Z', now)).toBe('aujourd’hui');
    expect(formatDayPhrase('2026-11-07T17:42:00Z', now)).toBe('hier');
  });

  test('gives the day and month this year, and the year before', () => {
    expect(formatDayPhrase('2026-11-05T09:00:00Z', now)).toBe('le 5 nov.');
    expect(formatDayPhrase('2025-10-14T09:00:00Z', now)).toBe('le 14 oct. 2025');
  });
});
