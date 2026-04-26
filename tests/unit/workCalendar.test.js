import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import {
  todayInZone,
  yesterdayInZone,
  parseDateInZone,
  endOfDayInZone,
  isWorkingDay,
  nextWorkingDay,
  generateSlots,
  isDateBeforeToday,
} from '../../src/cron/workCalendar.js';

const SETTINGS = {
  workDays: [1, 2, 3, 4, 5], // Mon..Fri
  holidays: [],
  workHours: { start: '09:00', end: '12:00' },
  slotDurationMinutes: 30,
};

describe('workCalendar', () => {
  it('todayInZone / yesterdayInZone return YYYY-MM-DD strings', () => {
    expect(todayInZone('Europe/Rome')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(yesterdayInZone('Europe/Rome')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('parseDateInZone + endOfDayInZone return luxon DateTimes', () => {
    const dt = parseDateInZone('2026-04-26', 'Europe/Rome');
    expect(dt.zoneName).toBe('Europe/Rome');
    const eod = endOfDayInZone('2026-04-26', 'Europe/Rome');
    expect(eod.hour).toBe(23);
    expect(eod.minute).toBe(59);
  });

  it('isWorkingDay returns false for weekends', () => {
    const sat = DateTime.fromISO('2026-04-25T10:00', { zone: 'Europe/Rome' });
    const sun = DateTime.fromISO('2026-04-26T10:00', { zone: 'Europe/Rome' });
    const mon = DateTime.fromISO('2026-04-27T10:00', { zone: 'Europe/Rome' });
    expect(isWorkingDay(sat, SETTINGS)).toBe(false);
    expect(isWorkingDay(sun, SETTINGS)).toBe(false);
    expect(isWorkingDay(mon, SETTINGS)).toBe(true);
  });

  it('isWorkingDay returns false on a configured holiday', () => {
    const settings = {
      ...SETTINGS,
      holidays: ['2026-04-27'], // a Monday
    };
    const mon = DateTime.fromISO('2026-04-27T10:00', { zone: 'Europe/Rome' });
    expect(isWorkingDay(mon, settings)).toBe(false);
  });

  it('nextWorkingDay skips weekends', () => {
    const fri = DateTime.fromISO('2026-04-24T10:00', { zone: 'Europe/Rome' });
    const next = nextWorkingDay(fri, SETTINGS);
    expect(next.toFormat('yyyy-LL-dd')).toBe('2026-04-27'); // Mon
  });

  it('nextWorkingDay returns null after maxIterations of holidays', () => {
    const settings = {
      ...SETTINGS,
      workDays: [], // no working days at all
    };
    const today = DateTime.fromISO('2026-04-26T10:00', { zone: 'Europe/Rome' });
    expect(nextWorkingDay(today, settings, 5)).toBeNull();
  });

  it('generateSlots produces non-overlapping slots within work hours', () => {
    const day = DateTime.fromISO('2026-04-27T00:00', { zone: 'Europe/Rome' });
    const slots = generateSlots(day, SETTINGS); // 09:00-12:00, 30min → 6 slots
    expect(slots).toHaveLength(6);
    expect(slots[0].time).toBe('09:00');
    expect(slots.at(-1).time).toBe('11:30');
    expect(slots.every((s) => s.date === '2026-04-27')).toBe(true);
  });

  it('isDateBeforeToday handles falsy + correct comparison', () => {
    expect(isDateBeforeToday('', 'Europe/Rome')).toBe(false);
    expect(isDateBeforeToday('1900-01-01', 'Europe/Rome')).toBe(true);
    const today = todayInZone('Europe/Rome');
    expect(isDateBeforeToday(today, 'Europe/Rome')).toBe(false);
  });
});
