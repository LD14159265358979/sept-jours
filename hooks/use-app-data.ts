import { useCallback, useEffect, useRef, useState } from 'react';
import { demoTasks } from '@/lib/demo-data';
import { canAddAppointment } from '@/lib/appointments';
import { expiredTaskIds } from '@/lib/date-utils';
import { isSupabaseConfigured } from '@/lib/supabase';
import { appointmentWithChanges, taskWithTitle } from '@/lib/record-updates';
import type { Appointment, DailyNote, Priority, Task, UpcomingEvent } from '@/lib/types';
import { deleteAppointment, deleteEvent, deleteNote, deleteTasks, fetchUserData, insertAppointment, insertEvent, insertTask, subscribeToUserData, updateAppointment as persistAppointment, updateTask as persistTask, updateTaskPositions, upsertNote } from '@/services/data-service';

type SyncState = 'synced' | 'syncing' | 'offline' | 'error';
type Cache = { tasks: Task[]; notes: DailyNote[]; events: UpcomingEvent[]; appointments: Appointment[] };

const demoNotes: DailyNote[] = [
  { id: 'note-today', date: '2026-09-07', text: 'Penser à appeler Camille pour confirmer le déjeuner de jeudi.', createdAt: '2026-09-07T08:00:00Z', updatedAt: '2026-09-07T08:00:00Z' },
  { id: 'note-tomorrow', date: '2026-09-08', text: 'Demander à Marc ses disponibilités pour la semaine prochaine.', createdAt: '2026-09-07T08:00:00Z', updatedAt: '2026-09-07T08:00:00Z' },
  { id: 'note-past-a', date: '2026-09-04', text: 'Réserver une matinée entière pour reprendre le plan du cours. Ne pas oublier les deux nouveaux exemples.', createdAt: '2026-09-04T08:00:00Z', updatedAt: '2026-09-04T08:00:00Z' },
  { id: 'note-past-b', date: '2026-09-02', text: 'Voir avec Anna si elle souhaite déjeuner près du jardin la semaine prochaine.', createdAt: '2026-09-02T08:00:00Z', updatedAt: '2026-09-02T08:00:00Z' },
];

const demoEvents: UpcomingEvent[] = [
  { id: 'event-term', name: 'la date du terme', date: '2026-09-30', createdAt: '2026-09-07T08:00:00Z', updatedAt: '2026-09-07T08:00:00Z' },
];

const demoAppointments: Appointment[] = [
  { id: 'appointment-doctor', date: '2026-09-08', time: '10:30', description: 'Rendez-vous avec le Dr Martin', isCompleted: false, completedAt: null, createdAt: '2026-09-07T08:00:00Z', updatedAt: '2026-09-07T08:00:00Z' },
  { id: 'appointment-camille', date: '2026-09-10', time: '12:30', description: 'Déjeuner avec Camille', isCompleted: false, completedAt: null, createdAt: '2026-09-07T08:00:00Z', updatedAt: '2026-09-07T08:00:00Z' },
];

function cacheKey(userId: string) { return `sept-jours-cache:${userId}`; }
function messageFrom(error: unknown) { return error instanceof Error ? error.message : 'La synchronisation a échoué.'; }
function normalizedPositions(tasks: Task[]) {
  const counters: Record<string, number> = {};
  return tasks.map((task) => ({ ...task, sortOrder: counters[task.scheduledDate] = (counters[task.scheduledDate] ?? -1) + 1 }));
}

export function useAppData(userId?: string) {
  const demo = !isSupabaseConfigured;
  const effectiveUserId = userId ?? 'demo';
  const [tasks, setTasks] = useState<Task[]>(demo ? demoTasks : []);
  const [notes, setNotes] = useState<DailyNote[]>(demo ? demoNotes : []);
  const [events, setEvents] = useState<UpcomingEvent[]>(demo ? demoEvents : []);
  const [appointments, setAppointments] = useState<Appointment[]>(demo ? demoAppointments : []);
  const [loading, setLoading] = useState(!demo);
  const [syncState, setSyncState] = useState<SyncState>(navigator.onLine ? 'synced' : 'offline');
  const [error, setError] = useState<string | null>(null);
  const noteTimers = useRef<Record<string, number>>({});

  const saveCache = useCallback((data: Cache) => {
    try { localStorage.setItem(cacheKey(effectiveUserId), JSON.stringify(data)); } catch { /* cache is best effort */ }
  }, [effectiveUserId]);

  const reload = useCallback(async () => {
    if (demo || !userId) return;
    if (!navigator.onLine) { setSyncState('offline'); return; }
    setSyncState('syncing');
    try {
      const data = await fetchUserData(userId);
      const expired = expiredTaskIds(data.tasks);
      if (expired.length) await deleteTasks(expired, userId);
      const cleanData = { ...data, tasks: data.tasks.filter((task) => !expired.includes(task.id)) };
      setTasks(cleanData.tasks); setNotes(cleanData.notes); setEvents(cleanData.events); setAppointments(cleanData.appointments);
      saveCache(cleanData); setError(null); setSyncState('synced');
    } catch (loadError) {
      setError(messageFrom(loadError)); setSyncState(navigator.onLine ? 'error' : 'offline');
    } finally { setLoading(false); }
  }, [demo, saveCache, userId]);

  useEffect(() => {
    if (demo || !userId) return;
    try {
      const cached = localStorage.getItem(cacheKey(userId));
      if (cached) { const data = JSON.parse(cached) as Cache; setTasks(data.tasks ?? []); setNotes(data.notes ?? []); setEvents(data.events ?? []); setAppointments(data.appointments ?? []); }
    } catch { /* ignore invalid cache */ }
    void reload();
    const unsubscribe = subscribeToUserData(userId, () => { void reload(); });
    const interval = window.setInterval(() => { void reload(); }, 15 * 60 * 1000);
    const onOnline = () => { void reload(); };
    const onOffline = () => setSyncState('offline');
    const onVisibility = () => { if (document.visibilityState === 'visible') void reload(); };
    window.addEventListener('online', onOnline); window.addEventListener('offline', onOffline); document.addEventListener('visibilitychange', onVisibility);
    return () => { unsubscribe(); window.clearInterval(interval); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); document.removeEventListener('visibilitychange', onVisibility); };
  }, [demo, reload, userId]);

  async function runRemote(action: () => Promise<void>, rollback: () => void) {
    if (demo || !userId) return;
    if (!navigator.onLine) { rollback(); setSyncState('offline'); return; }
    setSyncState('syncing');
    try { await action(); setError(null); setSyncState('synced'); }
    catch (actionError) { rollback(); setError(messageFrom(actionError)); setSyncState('error'); }
  }

  async function addTask(date: string, title: string, priority: Priority) {
    const now = new Date().toISOString();
    const task: Task = { id: crypto.randomUUID(), title, scheduledDate: date, priority, isCompleted: false, completedAt: null, sortOrder: tasks.filter((item) => item.scheduledDate === date).length, createdAt: now, updatedAt: now };
    const before = tasks; setTasks((current) => [...current, task]);
    await runRemote(() => insertTask(task, userId!), () => setTasks(before));
  }

  async function updateTask(id: string, patch: Partial<Task>) {
    const before = tasks; const fullPatch = { ...patch, updatedAt: new Date().toISOString() };
    setTasks((current) => current.map((task) => task.id === id ? (patch.title !== undefined ? taskWithTitle({ ...task, ...fullPatch }, patch.title, fullPatch.updatedAt) : { ...task, ...fullPatch }) : task));
    await runRemote(() => persistTask(id, userId!, patch), () => setTasks(before));
  }

  async function toggleTask(id: string) {
    const task = tasks.find((item) => item.id === id); if (!task) return;
    const isCompleted = !task.isCompleted;
    await updateTask(id, { isCompleted, completedAt: isCompleted ? new Date().toISOString() : null });
  }

  async function removeTask(id: string) {
    const before = tasks; setTasks((current) => current.filter((task) => task.id !== id));
    await runRemote(() => deleteTasks([id], userId!), () => setTasks(before));
  }

  async function reorderTasks(nextTasks: Task[]) {
    const before = tasks; const positioned = normalizedPositions(nextTasks); setTasks(positioned);
    await runRemote(() => updateTaskPositions(positioned, userId!), () => setTasks(before));
  }

  function changeNote(date: string, text: string) {
    const now = new Date().toISOString();
    const existing = notes.find((note) => note.date === date);
    const note: DailyNote = existing ? { ...existing, text, updatedAt: now } : { id: crypto.randomUUID(), date, text, createdAt: now, updatedAt: now };
    setNotes((current) => existing ? current.map((item) => item.id === existing.id ? note : item) : [note, ...current]);
    window.clearTimeout(noteTimers.current[date]);
    noteTimers.current[date] = window.setTimeout(() => { void runRemote(() => upsertNote(note, userId!), () => void reload()); }, 650);
  }

  async function removeNote(id: string) {
    const before = notes; setNotes((current) => current.filter((note) => note.id !== id));
    await runRemote(() => deleteNote(id, userId!), () => setNotes(before));
  }

  async function addEvent(name: string, date: string) {
    if (events.length >= 3) return;
    const now = new Date().toISOString();
    const item: UpcomingEvent = { id: crypto.randomUUID(), name, date, createdAt: now, updatedAt: now };
    const before = events; setEvents((current) => [...current, item]);
    await runRemote(() => insertEvent(item, userId!), () => setEvents(before));
  }

  async function removeEvent(id: string) {
    const before = events; setEvents((current) => current.filter((event) => event.id !== id));
    await runRemote(() => deleteEvent(id, userId!), () => setEvents(before));
  }

  async function addAppointment(date: string, time: string, description: string) {
    if (!canAddAppointment(appointments, date)) return;
    const now = new Date().toISOString();
    const appointment: Appointment = { id: crypto.randomUUID(), date, time, description, isCompleted: false, completedAt: null, createdAt: now, updatedAt: now };
    const before = appointments; setAppointments((current) => [...current, appointment]);
    await runRemote(() => insertAppointment(appointment, userId!), () => setAppointments(before));
  }

  async function toggleAppointment(id: string) {
    const appointment = appointments.find((item) => item.id === id); if (!appointment) return;
    const before = appointments;
    const isCompleted = !appointment.isCompleted;
    const patch = { isCompleted, completedAt: isCompleted ? new Date().toISOString() : null };
    setAppointments((current) => current.map((item) => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item));
    await runRemote(() => persistAppointment(id, userId!, patch), () => setAppointments(before));
  }

  async function updateAppointment(id: string, time: string, description: string) {
    const before = appointments;
    const updatedAt = new Date().toISOString();
    setAppointments((current) => current.map((appointment) => appointment.id === id ? appointmentWithChanges(appointment, { time, description }, updatedAt) : appointment));
    await runRemote(() => persistAppointment(id, userId!, { time, description }), () => setAppointments(before));
  }

  async function removeAppointment(id: string) {
    const before = appointments; setAppointments((current) => current.filter((appointment) => appointment.id !== id));
    await runRemote(() => deleteAppointment(id, userId!), () => setAppointments(before));
  }

  return { tasks, notes, events, appointments, loading, syncState, error, reload, addTask, updateTask, toggleTask, removeTask, reorderTasks, changeNote, removeNote, addEvent, removeEvent, addAppointment, updateAppointment, toggleAppointment, removeAppointment };
}
