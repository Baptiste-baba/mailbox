import { fr } from '../i18n/fr.ts';
import { calendarDay, dateFormatter, formatShortDate } from './calendar-day.ts';

function formatTime(date: Date): string {
  return dateFormatter({ hour: '2-digit', minute: '2-digit' }).format(date);
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
    return dateFormatter({ weekday: 'short' }).format(date);
  }
  return formatShortDate(date, then.year === today.year);
}

/** Date of an open message: the list date and the time, "hier, 18:42", or the time alone today. */
export function formatMessageDate(isoDate: string, now: Date): string {
  const day = formatListDate(isoDate, now);
  const time = formatTime(new Date(isoDate));
  return day === time ? time : fr.dates.dayAndTime(day, time);
}
