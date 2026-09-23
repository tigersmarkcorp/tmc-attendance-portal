/**
 * Overnight-aware per-day payroll calculation.
 *
 * Fixes the case where someone clocks in at night (e.g. Mon 8 PM) and clocks
 * out the next morning (Tue 5 AM):
 *  - The complete shift is calculated on the clock-in date (Mon), so midnight
 *    does not incorrectly split an 8-hour regular-work allowance into 2 days.
 *  - The "Out" event remains visible on its actual calendar date (Tue), while
 *    also completing the shift shown on the clock-in row.
 */

import { format, addDays, subDays } from 'date-fns';
import { formatPHTime } from '@/lib/philippineTime';

export interface PayrollTimeEntry {
  id: string;
  entry_type: string;
  timestamp: string;
  location?: string | null;
}

export function phDateOf(timestamp: string | Date): string {
  const d = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

/**
 * Fetch range expanded by one day on both ends so overnight sessions that
 * start before the period or end after it are complete.
 */
export function getPayrollFetchRange(start: Date, end: Date): { startStr: string; endStr: string } {
  const startStr = new Date(format(subDays(start, 1), 'yyyy-MM-dd') + 'T00:00:00+08:00').toISOString();
  const endStr = new Date(format(addDays(end, 1), 'yyyy-MM-dd') + 'T23:59:59+08:00').toISOString();
  return { startStr, endStr };
}

/**
 * Compute a single day's payroll figures from the full entry list.
 */
export function calculateDayPayroll(
  allEntries: PayrollTimeEntry[],
  day: Date,
  regularHoursPerDay: number,
) {
  const dayStr = format(day, 'yyyy-MM-dd');
  const sorted = [...allEntries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  type BreakPeriod = { start: Date; end: Date | null };
  type PayrollSession = {
    clockIn: PayrollTimeEntry;
    clockOut: PayrollTimeEntry | null;
    breaks: BreakPeriod[];
  };

  // Build complete shifts before assigning them to a payroll date. A night
  // shift belongs to the date it started, rather than being split at midnight.
  const sessions: PayrollSession[] = [];
  let current: PayrollSession | null = null;
  for (const entry of sorted) {
    const timestamp = new Date(entry.timestamp);
    if (entry.entry_type === 'clock_in') {
      if (current) {
        current.clockOut = { ...entry, entry_type: 'clock_out' };
        sessions.push(current);
      }
      current = { clockIn: entry, clockOut: null, breaks: [] };
    } else if (entry.entry_type === 'break_start' && current) {
      current.breaks.push({ start: timestamp, end: null });
    } else if (entry.entry_type === 'break_end' && current) {
      const openBreak = current.breaks[current.breaks.length - 1];
      if (openBreak && !openBreak.end) openBreak.end = timestamp;
    } else if (entry.entry_type === 'clock_out' && current) {
      const openBreak = current.breaks[current.breaks.length - 1];
      if (openBreak && !openBreak.end) openBreak.end = timestamp;
      current.clockOut = entry;
      sessions.push(current);
      current = null;
    }
  }
  if (current) sessions.push(current);

  const daySessions = sessions.filter((session) => phDateOf(session.clockIn.timestamp) === dayStr);
  const now = Date.now();
  const totalMs = daySessions.reduce((sum, session) => {
    const startedAt = new Date(session.clockIn.timestamp).getTime();
    const endedAt = session.clockOut ? new Date(session.clockOut.timestamp).getTime() : now;
    const breakMs = session.breaks.reduce((breakSum, period) => {
      const breakEnd = period.end?.getTime() ?? endedAt;
      return breakSum + Math.max(0, Math.min(breakEnd, endedAt) - Math.max(period.start.getTime(), startedAt));
    }, 0);
    return sum + Math.max(0, endedAt - startedAt - breakMs);
  }, 0);

  const dayEntries = sorted.filter((e) => phDateOf(e.timestamp) === dayStr);
  const firstClockIn = dayEntries.find((e) => e.entry_type === 'clock_in');
  const clockOuts = dayEntries.filter((e) => e.entry_type === 'clock_out');
  const lastClockOut = clockOuts.length ? clockOuts[clockOuts.length - 1] : null;

  const lastStartedSession = daySessions[daySessions.length - 1];
  const sessionClockOut = lastStartedSession?.clockOut ?? null;
  const carriedIn = !firstClockIn && Boolean(lastClockOut);
  const carriedOut = daySessions.some((session) =>
    Boolean(session.clockOut && phDateOf(session.clockOut.timestamp) !== dayStr),
  );

  const inEntry = firstClockIn ?? null;
  const outEntry = sessionClockOut ?? lastClockOut ?? null;

  const timeIn = inEntry ? formatPHTime(inEntry.timestamp) : null;
  const timeOut = outEntry ? formatPHTime(outEntry.timestamp) : null;

  // Exact calendar date (PH) of each event, so overnight shifts are unambiguous.
  const timeInDate = inEntry ? phDateOf(inEntry.timestamp) : null;
  const timeOutDate = outEntry ? phDateOf(outEntry.timestamp) : null;
  const timeInLabel = inEntry ? formatPHDateTime(inEntry.timestamp) : null;
  const timeOutLabel = outEntry ? formatPHDateTime(outEntry.timestamp) : null;

  const locationIn = firstClockIn?.location || null;
  const locationOut = sessionClockOut?.location || lastClockOut?.location || null;

  const totalHours = totalMs / (1000 * 60 * 60);

  return {
    totalMs,
    regularHours: Math.min(totalHours, regularHoursPerDay),
    overtimeHours: Math.max(0, totalHours - regularHoursPerDay),
    timeIn,
    timeOut,
    timeInDate,
    timeOutDate,
    timeInLabel,
    timeOutLabel,
    carriedIn,
    carriedOut,
    locationIn,
    locationOut,
  };
}

/** "Aug 6, 2026 · 10:47 PM" in Philippine time. */
export function formatPHDateTime(timestamp: string | Date): string {
  const d = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const datePart = d.toLocaleDateString('en-US', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${datePart} · ${formatPHTime(d)}`;
}


