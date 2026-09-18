import { describe, expect, it } from 'vitest';
import { calendarEventsForDate, eventOccursOn, monthGrid, remindersForDate, shiftMonth } from '@/lib/calendar-events';
import type { CalendarEvent } from '@/lib/types';

const weeklyEvent: CalendarEvent = {
  id: 'swimming',
  title: 'Bébés nageurs',
  startDate: '2026-09-17',
  time: '18:00',
  recurrence: 'weekly',
  recurrenceEndDate: null,
  reminderText: 'Préparer le sac de piscine',
  excludedDates: ['2026-10-29'],
  createdAt: '2026-09-01T08:00:00Z',
  updatedAt: '2026-09-01T08:00:00Z',
};

describe('calendar event recurrence', () => {
  it('repeats a weekly event on the same weekday', () => {
    expect(eventOccursOn(weeklyEvent, '2026-09-17')).toBe(true);
    expect(eventOccursOn(weeklyEvent, '2026-09-24')).toBe(true);
    expect(eventOccursOn(weeklyEvent, '2026-09-25')).toBe(false);
    expect(eventOccursOn(weeklyEvent, '2026-09-10')).toBe(false);
  });

  it('removes only an excluded occurrence', () => {
    expect(eventOccursOn(weeklyEvent, '2026-10-29')).toBe(false);
    expect(eventOccursOn(weeklyEvent, '2026-11-05')).toBe(true);
  });

  it('honours an optional recurrence end date', () => {
    const endingEvent = { ...weeklyEvent, recurrenceEndDate: '2026-10-08' };
    expect(eventOccursOn(endingEvent, '2026-10-08')).toBe(true);
    expect(eventOccursOn(endingEvent, '2026-10-15')).toBe(false);
  });

  it('keeps a one-off event on its chosen date only', () => {
    const oneOff = { ...weeklyEvent, recurrence: 'none' as const };
    expect(eventOccursOn(oneOff, '2026-09-17')).toBe(true);
    expect(eventOccursOn(oneOff, '2026-09-24')).toBe(false);
  });

  it('returns calendar items in time order and only reminders with text', () => {
    const earlier = { ...weeklyEvent, id: 'doctor', title: 'Médecin', time: '09:00', reminderText: null };
    expect(calendarEventsForDate([weeklyEvent, earlier], '2026-09-24').map((event) => event.id)).toEqual(['doctor', 'swimming']);
    expect(remindersForDate([weeklyEvent, earlier], '2026-09-24').map((event) => event.reminderText)).toEqual(['Préparer le sac de piscine']);
  });
});

describe('month calendar', () => {
  it('builds a six-week grid starting on Monday', () => {
    const days = monthGrid('2026-09-01');
    expect(days).toHaveLength(42);
    expect(days[0]).toBe('2026-08-31');
    expect(days[41]).toBe('2026-10-11');
  });

  it('moves across year boundaries', () => {
    expect(shiftMonth('2026-12-01', 1)).toBe('2027-01-01');
    expect(shiftMonth('2026-01-01', -1)).toBe('2025-12-01');
  });
});
