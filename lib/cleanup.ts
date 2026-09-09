import { expiredTaskIds } from '@/lib/date-utils';
import type { DailyNote, Task } from '@/lib/types';

export function cleanupPlan(tasks: Task[], notes: DailyNote[], now = new Date()) {
  return { expiredTaskIds: expiredTaskIds(tasks, now), notes };
}
