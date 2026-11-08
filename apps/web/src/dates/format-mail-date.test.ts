import { describe, expect, test } from 'vitest';
import { formatListDate, formatMessageDate } from './format-mail-date.ts';

// Sunday 8 November 2026, 11:00 in Paris, the time zone the tests run in (vitest.config.ts).
const now = new Date('2026-11-08T10:00:00Z');

describe('formatListDate', () => {
  test('gives the time for today, in the user’s time zone', () => {
    expect(formatListDate('2026-11-08T07:47:00Z', now)).toBe('08:47');
    expect(formatListDate('2026-11-07T23:30:00Z', now)).toBe('00:30');
  });

  test('says "hier" for yesterday', () => {
    expect(formatListDate('2026-11-07T17:42:00Z', now)).toBe('hier');
  });

  test('gives the day of the week within the week', () => {
    expect(formatListDate('2026-11-05T09:00:00Z', now)).toBe('jeu.');
  });

  test('gives the day and month this year, and the year before', () => {
    expect(formatListDate('2026-10-14T09:00:00Z', now)).toBe('14 oct.');
    expect(formatListDate('2025-10-14T09:00:00Z', now)).toBe('14 oct. 2025');
  });
});

describe('formatMessageDate', () => {
  test('adds the time to the day, except today where the time says it all', () => {
    expect(formatMessageDate('2026-11-08T07:47:00Z', now)).toBe('08:47');
    expect(formatMessageDate('2026-11-07T17:42:00Z', now)).toBe('hier, 18:42');
    expect(formatMessageDate('2025-10-14T09:00:00Z', now)).toBe('14 oct. 2025, 11:00');
  });
});
