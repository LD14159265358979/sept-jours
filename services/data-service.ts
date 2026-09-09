import { requireSupabase } from '@/lib/supabase';
import { localDateKey } from '@/lib/date-utils';
import type { Appointment, DailyNote, Priority, Task, UpcomingEvent } from '@/lib/types';

type TaskRow = { id: string; user_id: string; title: string; scheduled_date: string; priority: Priority; is_completed: boolean; completed_at: string | null; sort_order: number; created_at: string; updated_at: string };
type NoteRow = { id: string; user_id: string; date: string; text: string; created_at: string; updated_at: string };
type EventRow = { id: string; user_id: string; name: string; event_date: string; created_at: string; updated_at: string };
type AppointmentRow = { id: string; user_id: string; date: string; appointment_time: string; description: string; is_completed: boolean; completed_at: string | null; created_at: string; updated_at: string };

const mapTask = (row: TaskRow): Task => ({ id: row.id, userId: row.user_id, title: row.title, scheduledDate: row.scheduled_date, priority: row.priority, isCompleted: row.is_completed, completedAt: row.completed_at, sortOrder: row.sort_order, createdAt: row.created_at, updatedAt: row.updated_at });
const mapNote = (row: NoteRow): DailyNote => ({ id: row.id, userId: row.user_id, date: row.date, text: row.text, createdAt: row.created_at, updatedAt: row.updated_at });
const mapEvent = (row: EventRow): UpcomingEvent => ({ id: row.id, userId: row.user_id, name: row.name, date: row.event_date, createdAt: row.created_at, updatedAt: row.updated_at });
const mapAppointment = (row: AppointmentRow): Appointment => ({ id: row.id, userId: row.user_id, date: row.date, time: row.appointment_time.slice(0, 5), description: row.description, isCompleted: row.is_completed, completedAt: row.completed_at, createdAt: row.created_at, updatedAt: row.updated_at });

export async function fetchUserData(userId: string) {
  const client = requireSupabase();
  const [tasksResult, notesResult, eventsResult, appointmentsResult] = await Promise.all([
    client.from('tasks').select('*').eq('user_id', userId).order('scheduled_date').order('sort_order'),
    client.from('daily_notes').select('*').eq('user_id', userId).order('date', { ascending: false }),
    client.from('upcoming_events').select('*').eq('user_id', userId).gte('event_date', localDateKey()).order('event_date'),
    client.from('daily_appointments').select('*').eq('user_id', userId).order('date').order('appointment_time'),
  ]);
  const error = tasksResult.error ?? notesResult.error ?? eventsResult.error ?? appointmentsResult.error;
  if (error) throw error;
  return {
    tasks: (tasksResult.data as TaskRow[]).map(mapTask),
    notes: (notesResult.data as NoteRow[]).map(mapNote),
    events: (eventsResult.data as EventRow[]).map(mapEvent),
    appointments: (appointmentsResult.data as AppointmentRow[]).map(mapAppointment),
  };
}

export async function insertTask(task: Task, userId: string) {
  const { error } = await requireSupabase().from('tasks').insert({ id: task.id, user_id: userId, title: task.title, scheduled_date: task.scheduledDate, priority: task.priority, is_completed: task.isCompleted, completed_at: task.completedAt, sort_order: task.sortOrder });
  if (error) throw error;
}

export async function updateTask(id: string, userId: string, patch: Partial<Task>) {
  const payload: Record<string, unknown> = {};
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.scheduledDate !== undefined) payload.scheduled_date = patch.scheduledDate;
  if (patch.priority !== undefined) payload.priority = patch.priority;
  if (patch.isCompleted !== undefined) payload.is_completed = patch.isCompleted;
  if (patch.completedAt !== undefined) payload.completed_at = patch.completedAt;
  if (patch.sortOrder !== undefined) payload.sort_order = patch.sortOrder;
  const { error } = await requireSupabase().from('tasks').update(payload).eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function updateTaskPositions(tasks: Task[], userId: string) {
  await Promise.all(tasks.map((task) => updateTask(task.id, userId, { scheduledDate: task.scheduledDate, sortOrder: task.sortOrder })));
}

export async function deleteTasks(ids: string[], userId: string) {
  if (!ids.length) return;
  const { error } = await requireSupabase().from('tasks').delete().in('id', ids).eq('user_id', userId);
  if (error) throw error;
}

export async function upsertNote(note: DailyNote, userId: string) {
  const { error } = await requireSupabase().from('daily_notes').upsert({ id: note.id, user_id: userId, date: note.date, text: note.text }, { onConflict: 'user_id,date' });
  if (error) throw error;
}

export async function deleteNote(id: string, userId: string) {
  const { error } = await requireSupabase().from('daily_notes').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function insertEvent(event: UpcomingEvent, userId: string) {
  const { error } = await requireSupabase().from('upcoming_events').insert({ id: event.id, user_id: userId, name: event.name, event_date: event.date });
  if (error) throw error;
}

export async function deleteEvent(id: string, userId: string) {
  const { error } = await requireSupabase().from('upcoming_events').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function insertAppointment(appointment: Appointment, userId: string) {
  const { error } = await requireSupabase().from('daily_appointments').insert({ id: appointment.id, user_id: userId, date: appointment.date, appointment_time: appointment.time, description: appointment.description, is_completed: appointment.isCompleted, completed_at: appointment.completedAt });
  if (error) throw error;
}

export async function updateAppointment(id: string, userId: string, patch: Partial<Appointment>) {
  const payload: Record<string, unknown> = {};
  if (patch.time !== undefined) payload.appointment_time = patch.time;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.isCompleted !== undefined) payload.is_completed = patch.isCompleted;
  if (patch.completedAt !== undefined) payload.completed_at = patch.completedAt;
  const { error } = await requireSupabase().from('daily_appointments').update(payload).eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function deleteAppointment(id: string, userId: string) {
  const { error } = await requireSupabase().from('daily_appointments').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export function subscribeToUserData(userId: string, onChange: () => void) {
  const client = requireSupabase();
  const channel = client.channel(`sept-jours-${userId}`);
  for (const table of ['tasks', 'daily_notes', 'upcoming_events', 'daily_appointments']) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` }, onChange);
  }
  channel.subscribe();
  return () => { void client.removeChannel(channel); };
}
