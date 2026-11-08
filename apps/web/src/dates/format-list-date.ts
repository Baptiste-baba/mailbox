import { fr } from '../i18n/fr.ts';

const LOCALE = 'fr-FR';
const DAY_MS = 24 * 60 * 60 * 1000;

function formatter(options: Intl.DateTimeFormatOptions, timeZone: string | undefined) {
  return new Intl.DateTimeFormat(LOCALE, {
    ...options,
    ...(timeZone === undefined ? {} : { timeZone }),
  });
}

// Days are counted in the user's time zone: 00:30 there is today, whatever the UTC date says.
function calendarDay(date: Date, timeZone: string | undefined): number {
  const parts = formatter(
    { year: 'numeric', month: 'numeric', day: 'numeric' },
    timeZone,
  ).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((candidate) => candidate.type === type)?.value);
  return Date.UTC(part('year'), part('month') - 1, part('day')) / DAY_MS;
}

/**
 * Date of a mail in a list, as short as it can be read: "08:47" today, "hier", "lun." within the
 * week, "14 oct." this year, "14 oct. 2025" before.
 */
export function formatListDate(isoDate: string, now: Date, timeZone?: string): string {
  const date = new Date(isoDate);
  const daysAgo = calendarDay(now, timeZone) - calendarDay(date, timeZone);
  if (daysAgo <= 0) {
    return formatter({ hour: '2-digit', minute: '2-digit' }, timeZone).format(date);
  }
  if (daysAgo === 1) {
    return fr.dates.yesterday;
  }
  if (daysAgo < 7) {
    return formatter({ weekday: 'short' }, timeZone).format(date);
  }
  const sameYear =
    formatter({ year: 'numeric' }, timeZone).format(date) ===
    formatter({ year: 'numeric' }, timeZone).format(now);
  return formatter(
    { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) },
    timeZone,
  ).format(date);
}
