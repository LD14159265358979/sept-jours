import type { Day, Task } from '@/lib/types';

const DAY_MS = 86_400_000;

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseCalendarDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function addCalendarDays(value: string, amount: number) {
  const date = parseCalendarDate(value);
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
}

export function mondayOfWeek(value: string) {
  const date = parseCalendarDate(value);
  const offset = (date.getDay() + 6) % 7;
  return addCalendarDays(value, -offset);
}

export function differenceInCalendarDays(from: string, to: string) {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / DAY_MS);
}

export function getSevenDayWindow(start = localDateKey(), today = localDateKey()): Day[] {
  return Array.from({ length: 7 }, (_, index) => {
    const dateKey = addCalendarDays(start, index);
    const date = parseCalendarDate(dateKey);
    return {
      date: dateKey,
      label: new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(date),
      shortLabel: new Intl.DateTimeFormat('fr-FR', { weekday: 'narrow' }).format(date).toUpperCase(),
      dayNumber: String(date.getDate()),
      month: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date).replace('.', '') + '.',
      isToday: dateKey === today,
    };
  });
}

export function shiftSevenDayWindow(start: string, today: string, direction: -1 | 1) {
  const shifted = addCalendarDays(start, direction * 7);
  return direction === 1 && shifted > today ? today : shifted;
}

export function formatWeekRange(days: Day[]) {
  const first = parseCalendarDate(days[0].date);
  const last = parseCalendarDate(days[6].date);
  const firstMonth = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(first);
  const lastMonth = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(last);
  if (first.getFullYear() !== last.getFullYear()) return `${first.getDate()} ${firstMonth} ${first.getFullYear()} – ${last.getDate()} ${lastMonth} ${last.getFullYear()}`;
  if (first.getMonth() !== last.getMonth()) return `${first.getDate()} ${firstMonth} – ${last.getDate()} ${lastMonth} ${last.getFullYear()}`;
  return `${first.getDate()}–${last.getDate()} ${lastMonth} ${last.getFullYear()}`;
}

export function isTaskExpired(task: Pick<Task, 'scheduledDate' | 'isCompleted' | 'completedAt'>, now = new Date()) {
  const today = localDateKey(now);
  const olderThanScheduleLimit = differenceInCalendarDays(task.scheduledDate, today) > 30;
  const completedTooLongAgo = Boolean(task.isCompleted && task.completedAt && now.getTime() - new Date(task.completedAt).getTime() >= 7 * DAY_MS);
  return olderThanScheduleLimit || completedTooLongAgo;
}

export function expiredTaskIds(tasks: Pick<Task, 'id' | 'scheduledDate' | 'isCompleted' | 'completedAt'>[], now = new Date()) {
  return tasks.filter((task) => isTaskExpired(task, now)).map((task) => task.id);
}
