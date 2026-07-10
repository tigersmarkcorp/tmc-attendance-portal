/**
 * Philippine Time Utility
 * Always returns time based on Asia/Manila timezone (UTC+8)
 * regardless of the device's local time settings.
 */

const PH_TIMEZONE = 'Asia/Manila';

/**
 * Get current date/time in Philippine timezone as a Date-like object.
 * Note: JavaScript Date objects are always UTC internally,
 * so we create a "shifted" Date that displays PH time when using
 * non-timezone-aware methods.
 */
export function getPhilippineNow(): Date {
  // Get the current UTC time
  const now = new Date();
  // Get the PH time string
  const phString = now.toLocaleString('en-US', { timeZone: PH_TIMEZONE });
  // Parse it back to a Date (this creates a Date whose local representation matches PH time)
  return new Date(phString);
}

/**
 * Get current Philippine time as an ISO string suitable for database storage.
 * This returns the actual PH time as a timestamp.
 */
export function getPhilippineISO(): string {
  const phNow = getPhilippineNow();
  return phNow.toISOString();
}

/**
 * Get today's date string in yyyy-MM-dd format in Philippine timezone.
 */
export function getPhilippineToday(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: PH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // Returns yyyy-MM-dd
}

/**
 * Format a date using Philippine timezone.
 * Returns formatted parts that can be used for display.
 */
export function formatPhilippineTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: PH_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  return d.toLocaleString('en-US', { ...defaultOptions, ...options });
}

/**
 * Get the current Philippine time formatted as HH:mm:ss
 */
export function getPhilippineTimeString(): string {
  return new Date().toLocaleString('en-US', {
    timeZone: PH_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Get the current Philippine date formatted as a readable string
 * e.g., "Saturday, March 1, 2026"
 */
export function getPhilippineDateString(): string {
  return new Date().toLocaleString('en-US', {
    timeZone: PH_TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get Philippine date formatted as "MMMM yyyy"
 */
export function getPhilippineMonthYear(): string {
  return new Date().toLocaleString('en-US', {
    timeZone: PH_TIMEZONE,
    year: 'numeric',
    month: 'long',
  });
}

/**
 * Format a timestamp to Philippine time display (e.g., "2:30 PM")
 */
export function formatPHTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    timeZone: PH_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a timestamp to Philippine 24h time (e.g., "14:30")
 */
export function formatPH24(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    timeZone: PH_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format a date to Philippine date string (e.g., "Mar 1, 2026")
 */
export function formatPHDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    timeZone: PH_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get start of today in Philippine timezone as ISO string (UTC)
 */
export function getPhilippineTodayStart(): string {
  const today = getPhilippineToday();
  // Philippine time is UTC+8, so midnight PHT = 16:00 UTC previous day
  // Convert PHT midnight to UTC ISO string
  const phMidnight = new Date(`${today}T00:00:00+08:00`);
  return phMidnight.toISOString();
}

/**
 * Get end of today in Philippine timezone as ISO string (UTC)
 */
export function getPhilippineTodayEnd(): string {
  const today = getPhilippineToday();
  const phEnd = new Date(`${today}T23:59:59+08:00`);
  return phEnd.toISOString();
}
