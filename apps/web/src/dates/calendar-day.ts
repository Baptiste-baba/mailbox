import { LOCALE } from '../locale.ts';

const DAY_MS = 24 * 60 * 60 * 1000;
const formatters = new Map<string, Intl.DateTimeFormat>();

// Built once per shape and reused: a list formats the date of every visible row on each render.
export function dateFormatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify(options);
  let cached = formatters.get(key);
  if (cached === undefined) {
    cached = new Intl.DateTimeFormat(LOCALE, options);
    formatters.set(key, cached);
  }
  return cached;
}

/** The day of a date, counted in the user's time zone: 00:30 there is today, whatever UTC says. */
export function calendarDay(date: Date): { day: number; year: number } {
  const parts = dateFormatter({ year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(
    date,
  );
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((candidate) => candidate.type === type)?.value);
  return {
    day: Date.UTC(part('year'), part('month') - 1, part('day')) / DAY_MS,
    year: part('year'),
  };
}

/** "14 oct." in the current year, "14 oct. 2025" in another. */
export function formatShortDate(date: Date, inCurrentYear: boolean): string {
  return inCurrentYear
    ? dateFormatter({ day: 'numeric', month: 'short' }).format(date)
    : dateFormatter({ day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}
