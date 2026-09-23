/**
 * Overnight-aware time calculation utility.
 * Splits clock-in/clock-out sessions across day boundaries (PHT).
 * Example: Clock in June 1 at 11 PM, clock out June 2 at 2 AM
 *   → June 1 gets 1 hour, June 2 gets 2 hours.
 */

import { format, subDays } from 'date-fns';

interface TimeEntry {
  id: string;
  entry_type: string;
  timestamp: string;
}

interface WorkSession {
  clockIn: Date;
  clockOut: Date | null; // null = still active
  breaks: { start: Date; end: Date | null }[];
}

/**
 * Build work sessions from a sorted list of time entries.
 */
export function buildSessions(entries: TimeEntry[]): WorkSession[] {
  const sessions: WorkSession[] = [];
  let current: WorkSession | null = null;

  for (const entry of entries) {
    const ts = new Date(entry.timestamp);
    switch (entry.entry_type) {
      case 'clock_in':
        // If there's an unclosed session, close it at this clock_in time
        if (current && !current.clockOut) {
          current.clockOut = ts;
          sessions.push(current);
        }
        current = { clockIn: ts, clockOut: null, breaks: [] };
        break;
      case 'break_start':
        if (current && !current.clockOut) {
          current.breaks.push({ start: ts, end: null });
        }
        break;
      case 'break_end':
        if (current && !current.clockOut) {
          const lastBreak = current.breaks[current.breaks.length - 1];
          if (lastBreak && !lastBreak.end) {
            lastBreak.end = ts;
          }
        }
        break;
      case 'clock_out':
        if (current && !current.clockOut) {
          // Close any open break
          const openBreak = current.breaks[current.breaks.length - 1];
          if (openBreak && !openBreak.end) {
            openBreak.end = ts;
          }
          current.clockOut = ts;
          sessions.push(current);
          current = null;
        }
        break;
    }
  }

  // If there's still an open session (clocked in, no clock out)
  if (current && !current.clockOut) {
    sessions.push(current);
  }

  return sessions;
}

/**
 * Get the PHT day boundaries for a given date.
 */
function getDayBoundsPHT(day: Date): { start: number; end: number } {
  const dayStr = format(day, 'yyyy-MM-dd');
  const start = new Date(`${dayStr}T00:00:00+08:00`).getTime();
  const end = new Date(`${dayStr}T23:59:59.999+08:00`).getTime();
  return { start, end };
}

/**
 * Calculate work time from sessions that falls within a specific day (PHT).
 * Properly splits overnight sessions across day boundaries.
 */
export function calculateDayTimeFromSessions(sessions: WorkSession[], day: Date): number {
  const { start: dayStart, end: dayEnd } = getDayBoundsPHT(day);
  let totalMs = 0;

  for (const session of sessions) {
    const sessionStart = session.clockIn.getTime();
    const sessionEnd = session.clockOut ? session.clockOut.getTime() : Date.now();

    // Clip session to this day's boundaries
    const clippedStart = Math.max(sessionStart, dayStart);
    const clippedEnd = Math.min(sessionEnd, dayEnd);

    if (clippedStart >= clippedEnd) continue;

    let workMs = clippedEnd - clippedStart;

    // Subtract breaks that overlap with this day
    for (const brk of session.breaks) {
      const breakStart = brk.start.getTime();
      const breakEnd = brk.end ? brk.end.getTime() : Date.now();

      const clippedBreakStart = Math.max(breakStart, dayStart);
      const clippedBreakEnd = Math.min(breakEnd, dayEnd);

      if (clippedBreakStart < clippedBreakEnd) {
        workMs -= (clippedBreakEnd - clippedBreakStart);
      }
    }

    totalMs += Math.max(0, workMs);
  }

  return totalMs;
}

/**
 * Get entries relevant to a day for display purposes.
 * Includes entries whose timestamp falls on this PHT day,
 * plus indicators for overnight carry-over sessions.
 */
export function getEntriesForDayPHT(entries: TimeEntry[], day: Date): TimeEntry[] {
  const dayStr = format(day, 'yyyy-MM-dd');
  return entries.filter(e => {
    const entryPHDate = new Date(e.timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    return entryPHDate === dayStr;
  });
}

/**
 * Check if a day has carry-over time from a session that started on a previous day.
 */
export function hasCarryOver(sessions: WorkSession[], day: Date): boolean {
  const { start: dayStart } = getDayBoundsPHT(day);
  return sessions.some(session => {
    const sessionStart = session.clockIn.getTime();
    const sessionEnd = session.clockOut ? session.clockOut.getTime() : Date.now();
    // Session started before this day but extends into this day
    return sessionStart < dayStart && sessionEnd > dayStart;
  });
}

/**
 * Get the expanded fetch range to capture overnight sessions.
 * Extends the start date by 1 day to catch clock-ins from the previous day.
 */
export function getExpandedFetchRange(start: Date, end: Date): { fetchStart: string; fetchEnd: string } {
  const expandedStart = subDays(start, 1);
  const fetchStart = new Date(format(expandedStart, 'yyyy-MM-dd') + 'T00:00:00+08:00').toISOString();
  const fetchEnd = new Date(format(end, 'yyyy-MM-dd') + 'T23:59:59+08:00').toISOString();
  return { fetchStart, fetchEnd };
}
