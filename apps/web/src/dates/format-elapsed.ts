import { LOCALE } from '../locale.ts';

const MINUTE_MS = 60 * 1000;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
/** Below two days, a time is told in hours: "36 h" reads better than "1 j". */
const HOURS_BEFORE_DAYS = 48;

function unitFormatter(unit: 'minute' | 'hour' | 'day'): Intl.NumberFormat {
  return new Intl.NumberFormat(LOCALE, { style: 'unit', unit, unitDisplay: 'short' });
}

const minutes = unitFormatter('minute');
const hours = unitFormatter('hour');
const days = unitFormatter('day');

/** How long ago a date was, in the largest unit that reads well: "25 min", "3 h", "4 j". */
export function formatElapsed(isoDate: string, now: Date): string {
  const elapsedMinutes = Math.max(1, Math.floor((now.getTime() - Date.parse(isoDate)) / MINUTE_MS));
  if (elapsedMinutes < MINUTES_PER_HOUR) {
    return minutes.format(elapsedMinutes);
  }
  const elapsedHours = Math.floor(elapsedMinutes / MINUTES_PER_HOUR);
  return elapsedHours < HOURS_BEFORE_DAYS
    ? hours.format(elapsedHours)
    : days.format(Math.floor(elapsedHours / HOURS_PER_DAY));
}
