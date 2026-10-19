/// <reference types="bun" />
import { describe, test, expect } from 'bun:test';
import { calculateDayPayroll } from './payrollDayCalc';

const event = (id: string, entry_type: string, timestamp: string, location: string | null = null) => ({ id, entry_type, timestamp, location });
const day = (value: string) => new Date(`${value}T00:00:00`);

describe('Payroll event identity', () => {
  test('night shift preserves next-day clock-out and separate actual places with 8 regular hours', () => {
    const entries = [event('in', 'clock_in', '2026-10-15T20:00:00+08:00', 'Site A, 14.722393652066936, 121.13153535488307'), event('out', 'clock_out', '2026-10-16T05:00:00+08:00', 'Site B')];
    const result = calculateDayPayroll(entries, day('2026-10-15'), 8);
    expect(result.timeIn).toBe('8:00 PM');
    expect(result.timeOut).toBe('5:00 AM');
    expect(result.timeOutDate).toBe('2026-10-16');
    expect(result.locationIn).toBe('Site A');
    expect(result.locationOut).toBe('Site B');
    expect(result.regularHours).toBe(8);
    expect(result.overtimeHours).toBe(1);
    const next = calculateDayPayroll(entries, day('2026-10-16'), 8);
    expect(next.timeOutDate).toBe('2026-10-16');
    expect(next.locationOut).toBe('Site B');
    expect(next.totalMs).toBe(0);
  });
  test('an open shift does not borrow an earlier clock-out or its location', () => {
    const result = calculateDayPayroll([event('a', 'clock_in', '2026-10-15T20:00:00+08:00', 'A'), event('b', 'clock_out', '2026-10-16T05:00:00+08:00', 'B'), event('c', 'clock_in', '2026-10-16T20:00:00+08:00', 'C')], day('2026-10-16'), 8);
    expect(result.timeOut).toBeNull();
    expect(result.locationIn).toBe('C');
    expect(result.locationOut).toBeNull();
  });
  test('missing saved locations cannot borrow a different shift location', () => {
    const result = calculateDayPayroll([event('a', 'clock_in', '2026-10-16T06:00:00+08:00', 'A'), event('b', 'clock_out', '2026-10-16T08:00:00+08:00', 'B'), event('c', 'clock_in', '2026-10-16T09:00:00+08:00', 'C'), event('d', 'clock_out', '2026-10-16T11:00:00+08:00')], day('2026-10-16'), 8);
    expect(result.locationIn).toBe('A');
    expect(result.locationOut).toBeNull();
    expect(result.totalMs).toBe(4 * 3600000);
  });
  test('a replacement clock-in is never shown as an actual clock-out', () => {
    const result = calculateDayPayroll([event('a', 'clock_in', '2026-10-15T20:00:00+08:00', 'A'), event('b', 'clock_in', '2026-10-16T08:00:00+08:00', 'B')], day('2026-10-15'), 8);
    expect(result.timeOut).toBeNull();
    expect(result.locationOut).toBeNull();
    expect(result.totalMs).toBe(12 * 3600000);
  });
});