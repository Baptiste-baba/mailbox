import { fr } from '../i18n/fr.ts';
import { calendarDay, formatShortDate } from './calendar-day.ts';

/**
 * The day of a date as a sentence says it after a verb, as in "Ajoutée …": "aujourd’hui", "hier",
 * "le 3 nov." this year, "le 14 oct. 2025" before.
 */
export function formatDayPhrase(isoDate: string, now: Date): string {
  const date = new Date(isoDate);
  const then = calendarDay(date);
  const today = calendarDay(now);
  const daysAgo = today.day - then.day;
  if (daysAgo <= 0) {
    return fr.dates.today;
  }
  if (daysAgo === 1) {
    return fr.dates.yesterday;
  }
  return fr.dates.onDay(formatShortDate(date, then.year === today.year));
}
