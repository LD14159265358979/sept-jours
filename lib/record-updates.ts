import type { Appointment, Task } from '@/lib/types';

export function taskWithTitle(task: Task, title: string, updatedAt: string): Task {
  return { ...task, title, updatedAt };
}

export function appointmentWithChanges(appointment: Appointment, changes: Pick<Appointment, 'time' | 'description'>, updatedAt: string): Appointment {
  return { ...appointment, ...changes, updatedAt };
}
