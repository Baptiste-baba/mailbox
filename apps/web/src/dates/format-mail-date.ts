import { fr } from '../i18n/fr.ts';
import { LOCALE } from '../locale.ts';

const DAY_MS = 24 * 60 * 60 * 1000;
const formatters = new Map<string, Intl.DateTimeFormat>();

// Built once per shape and reused: a list formats the date of every visible row on each render.
function formatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify(options);
  let cached = formatters.get(key);
  if (cached === undefined) {
    cached = new Intl.DateTimeFormat(LOCALE, options);
    formatters.set(key, cached);
  }
  return cached;
}

// Days are counted in the user's time zone: 00:30 there is today, whatever the UTC date says.
function calendarDay(date: Date): { day: number; year: number } {
  const parts = formatter({ year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(
    date,
  );
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((candidate) => candidate.type === type)?.value);
  return {
    day: Date.UTC(part('year'), part('month') - 1, part('day')) / DAY_MS,
    year: part('year'),
  };
}

function formatTime(date: Date): string {
  return formatter({ hour: '2-digit', minute: '2-digit' }).format(date);
}

/**
 * Date of a mail in a list, as short as it can be read: "08:47" today, "hier", "lun." within the
 * week, "14 oct." this year, "14 oct. 2025" before.
 */
export function formatListDate(isoDate: string, now: Date): string {
  const date = new Date(isoDate);
  const then = calendarDay(date);
  const today = calendarDay(now);
  const daysAgo = today.day - then.day;
  if (daysAgo <= 0) {
    return formatTime(date);
  }
  if (daysAgo === 1) {
    return fr.dates.yesterday;
  }
  if (daysAgo < 7) {
    return formatter({ weekday: 'short' }).format(date);
  }
  return then.year === today.year
    ? formatter({ day: 'numeric', month: 'short' }).format(date)
    : formatter({ day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

/** Date of an open message: the list date and the time, "hier, 18:42", or the time alone today. */
export function formatMessageDate(isoDate: string, now: Date): string {
  const day = formatListDate(isoDate, now);
  const time = formatTime(new Date(isoDate));
  return day === time ? time : fr.dates.dayAndTime(day, time);
}
