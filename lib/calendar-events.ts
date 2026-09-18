import { addCalendarDays, parseCalendarDate } from '@/lib/date-utils';
import type { CalendarEvent } from '@/lib/types';

const DAY_IN_MS = 86_400_000;

function utcDayNumber(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_IN_MS);
}

export function eventOccursOn(event: CalendarEvent, date: string) {
  if (date < event.startDate || event.excludedDates.includes(date)) return false;
  if (event.recurrenceEndDate && date > event.recurrenceEndDate) return false;
  if (event.recurrence === 'none') return date === event.startDate;
  return (utcDayNumber(date) - utcDayNumber(event.startDate)) % 7 === 0;
}

export function calendarEventsForDate(events: CalendarEvent[], date: string) {
  return events.filter((event) => eventOccursOn(event, date)).sort((a, b) => a.time.localeCompare(b.time) || a.title.localeCompare(b.title, 'fr'));
}

export function remindersForDate(events: CalendarEvent[], date: string) {
  return calendarEventsForDate(events, date).filter((event) => event.reminderText?.trim());
}

export function monthGrid(monthDate: string) {
  const first = parseCalendarDate(monthDate.slice(0, 7) + '-01');
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = addCalendarDays(monthDate.slice(0, 7) + '-01', -mondayOffset);
  return Array.from({ length: 42 }, (_, index) => addCalendarDays(start, index));
}

export function shiftMonth(monthDate: string, direction: -1 | 1) {
  const date = parseCalendarDate(monthDate.slice(0, 7) + '-01');
  date.setMonth(date.getMonth() + direction);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}
