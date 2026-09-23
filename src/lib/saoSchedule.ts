/**
 * SAO Weekly Schedule helpers.
 * Overnight-aware: if clock_out_time <= clock_in_time it means the shift
 * ends the following day (e.g. Mon 20:00 -> Tue 05:00).
 */

export interface SAOScheduleRow {
  day_of_week: number; // 0 = Sunday .. 6 = Saturday
  clock_in_time: string | null;  // 'HH:MM:SS'
  clock_out_time: string | null; // 'HH:MM:SS'
  is_rest_day: boolean;
}

const PH_TZ = 'Asia/Manila';

/** Get PH weekday (0=Sun..6=Sat) and yyyy-MM-dd of the given instant. */
export function getPHDayInfo(date: Date): { dow: number; ymd: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PH_TZ,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const map: Record<string, string> = {};
  parts.forEach(p => (map[p.type] = p.value));
  const dowMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return {
    dow: dowMap[map.weekday] ?? 0,
    ymd: `${map.year}-${map.month}-${map.day}`,
  };
}

/** Build a PHT Date from yyyy-MM-dd + HH:MM(:SS). */
function phDateTime(ymd: string, hms: string): Date {
  const time = hms.length === 5 ? `${hms}:00` : hms;
  return new Date(`${ymd}T${time}+08:00`);
}

/** Add N days to a yyyy-MM-dd string (in PHT). */
function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

/**
 * For a given actual clock-in instant, resolve the scheduled shift
 * (scheduled clock-in / clock-out Date in real time) using the SAO's
 * weekly schedule. Overnight-safe.
 *
 * Returns null if there is no schedule for the matched PHT day OR
 * that day is a rest day OR times are missing.
 */
export function getScheduledShiftForClockIn(
  clockInAt: Date,
  schedule: SAOScheduleRow[]
): { scheduledIn: Date; scheduledOut: Date; isRestDay: boolean } | null {
  const byDow: Record<number, SAOScheduleRow> = {};
  schedule.forEach(s => (byDow[s.day_of_week] = s));

  const { dow, ymd } = getPHDayInfo(clockInAt);

  // Primary match: schedule for today.
  const today = byDow[dow];
  if (today && !today.is_rest_day && today.clock_in_time && today.clock_out_time) {
    const scheduledIn = phDateTime(ymd, today.clock_in_time);
    let scheduledOut = phDateTime(ymd, today.clock_out_time);
    if (scheduledOut.getTime() <= scheduledIn.getTime()) {
      // Overnight: clock-out is on the next day.
      scheduledOut = phDateTime(addDays(ymd, 1), today.clock_out_time);
    }
    // If the clock-in is within a reasonable window of the scheduled shift, use it.
    // Window: from 4h before scheduledIn to scheduledOut.
    const windowStart = scheduledIn.getTime() - 4 * 60 * 60 * 1000;
    if (clockInAt.getTime() >= windowStart && clockInAt.getTime() <= scheduledOut.getTime()) {
      return { scheduledIn, scheduledOut, isRestDay: false };
    }
    // Otherwise still return today's schedule as best match.
    return { scheduledIn, scheduledOut, isRestDay: false };
  }

  if (today && today.is_rest_day) {
    return null; // rest day (no schedule)
  }

  return null;
}

/**
 * Compute late minutes (>= 0) and undertime minutes (>= 0) given the actual
 * clock in/out timestamps and the SAO's weekly schedule.
 */
export function computeLateUndertime(params: {
  clockIn: Date | null;
  clockOut: Date | null;
  schedule: SAOScheduleRow[];
}): { lateMinutes: number; undertimeMinutes: number; isRestDay: boolean; scheduled: { in: Date; out: Date } | null } {
  const { clockIn, clockOut, schedule } = params;
  if (!clockIn) {
    return { lateMinutes: 0, undertimeMinutes: 0, isRestDay: false, scheduled: null };
  }

  const { dow } = getPHDayInfo(clockIn);
  const dayRow = schedule.find(s => s.day_of_week === dow);
  const isRestDay = !!dayRow?.is_rest_day;

  const shift = getScheduledShiftForClockIn(clockIn, schedule);
  if (!shift) {
    return { lateMinutes: 0, undertimeMinutes: 0, isRestDay, scheduled: null };
  }

  const lateMs = clockIn.getTime() - shift.scheduledIn.getTime();
  const lateMinutes = lateMs > 0 ? Math.floor(lateMs / 60000) : 0;

  let undertimeMinutes = 0;
  if (clockOut) {
    const undertimeMs = shift.scheduledOut.getTime() - clockOut.getTime();
    undertimeMinutes = undertimeMs > 0 ? Math.floor(undertimeMs / 60000) : 0;
  }

  return {
    lateMinutes,
    undertimeMinutes,
    isRestDay,
    scheduled: { in: shift.scheduledIn, out: shift.scheduledOut },
  };
}

export const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon-first display
