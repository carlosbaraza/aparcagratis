import { SCHEDULE } from "./tariffs";

export interface WindowSplit {
  totalMinutes: number;
  regulatedMinutes: number;
  freeMinutes: number;
}

type HolidayPredicate = (date: Date) => boolean;

const MS_PER_MINUTE = 60_000;

/** Build a Date at a given whole hour on the same calendar day as `day`. */
function atHour(day: Date, hour: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0, 0);
}

/**
 * The SER active interval for the calendar day of `day`, or null if the whole
 * day is free (Sunday, holiday, or a Sunday in August).
 */
function activeIntervalForDay(
  day: Date,
  isHoliday: HolidayPredicate,
): { start: Date; end: Date } | null {
  const weekday = day.getDay(); // 0 = Sunday … 6 = Saturday
  if (weekday === 0 || isHoliday(day)) return null;

  const month = day.getMonth() + 1; // 1-based
  let hours: { start: number; end: number };

  if (month === 8) {
    hours = SCHEDULE.august; // Mon–Sat reduced hours
  } else if (weekday === 6) {
    hours = SCHEDULE.saturday;
  } else {
    hours = SCHEDULE.weekday;
  }

  return { start: atHour(day, hours.start), end: atHour(day, hours.end) };
}

/** Overlap in minutes between [aStart, aEnd) and [bStart, bEnd). */
function overlapMinutes(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): number {
  const start = Math.max(aStart.getTime(), bStart.getTime());
  const end = Math.min(aEnd.getTime(), bEnd.getTime());
  return end > start ? (end - start) / MS_PER_MINUTE : 0;
}

/**
 * Split a parking window into regulated (SER charges apply) and free minutes,
 * walking day by day so windows spanning midnight, weekends and holidays are
 * handled correctly.
 */
export function splitParkingWindow(
  start: Date,
  end: Date,
  isHoliday: HolidayPredicate = () => false,
): WindowSplit {
  const totalMinutes = Math.max(0, (end.getTime() - start.getTime()) / MS_PER_MINUTE);
  let regulatedMinutes = 0;

  // Iterate over each calendar day touched by the window.
  let cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  while (cursor.getTime() <= end.getTime()) {
    const interval = activeIntervalForDay(cursor, isHoliday);
    if (interval) {
      regulatedMinutes += overlapMinutes(interval.start, interval.end, start, end);
    }
    cursor = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      cursor.getDate() + 1,
    );
  }

  return {
    totalMinutes,
    regulatedMinutes,
    freeMinutes: totalMinutes - regulatedMinutes,
  };
}
