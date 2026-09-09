import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpenText, Check, Cloud, CloudOff, LoaderCircle, LogOut, TriangleAlert } from 'lucide-react';
import { closestCorners, DndContext, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { AuthScreen } from '@/components/auth-screen';
import { Button } from '@/components/ui/button';
import { DayColumn } from '@/components/day-column';
import { DayTab } from '@/components/day-tab';
import { EventCountdown } from '@/components/event-countdown';
import { PastNotes } from '@/components/past-notes';
import { addCalendarDays, formatWeekRange, getSevenDayWindow, localDateKey, mondayOfWeek } from '@/lib/date-utils';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Priority, Task } from '@/lib/types';
import { getWeeklyVerse } from '@/lib/weekly-verses';
import { useAppData } from '@/hooks/use-app-data';
import { useSession } from '@/hooks/use-session';

const syncLabels = {
  synced: { text: 'Synchronisé', icon: Cloud },
  syncing: { text: 'Synchronisation…', icon: LoaderCircle },
  offline: { text: 'Hors connexion', icon: CloudOff },
  error: { text: 'Synchronisation impossible', icon: TriangleAlert },
};

export default function App() {
  const { session, loading: sessionLoading } = useSession();
  const data = useAppData(session?.user.id);
  const today = localDateKey();
  const days = useMemo(() => getSevenDayWindow(today), [today]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [view, setView] = useState<'week' | 'notes'>('week');
  const verse = getWeeklyVerse(mondayOfWeek(today));
  const sync = syncLabels[data.syncState];
  const addTaskRef = useRef(data.addTask);
  addTaskRef.current = data.addTask;
  const SyncIcon = sync.icon;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 260, tolerance: 7 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const visibleTasks = useMemo(() => data.tasks.reduce<Record<string, Task[]>>((groups, task) => {
    groups[task.scheduledDate] = [...(groups[task.scheduledDate] ?? []), task].sort((a, b) => a.sortOrder - b.sortOrder);
    return groups;
  }, {}), [data.tasks]);

  const visibleAppointments = useMemo(() => [...data.appointments].sort((a, b) => a.time.localeCompare(b.time)).reduce<Record<string, typeof data.appointments>>((groups, appointment) => {
    groups[appointment.date] = [...(groups[appointment.date] ?? []), appointment];
    return groups;
  }, {}), [data.appointments]);

  useEffect(() => {
    type ToolRegistry = { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> };
    const context = (document as Document & { modelContext?: ToolRegistry }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'create_task', title: 'Ajouter une tâche', description: 'Ajoute une tâche à une date visible dans Sept Jours.',
      inputSchema: { type: 'object', properties: { date: { type: 'string' }, title: { type: 'string' }, priority: { type: 'string', enum: ['red', 'yellow', 'green'] } }, required: ['date', 'title', 'priority'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input: unknown) {
        const value = input as { date?: string; title?: string; priority?: Priority };
        if (!value.date || !value.title?.trim() || !value.priority || !days.some((day) => day.date === value.date)) throw new Error('Date, titre ou priorité invalide.');
        await addTaskRef.current(value.date, value.title.trim(), value.priority);
        return { status: 'created', scheduledDate: value.date, title: value.title.trim() };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [days]);

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const targetDate = over.data.current?.scheduledDate as string | undefined;
    if (!targetDate) return;
    const current = data.tasks;
    const activeIndex = current.findIndex((task) => task.id === active.id);
    if (activeIndex < 0) return;
    const moving = { ...current[activeIndex], scheduledDate: targetDate };
    const reordered = current.filter((task) => task.id !== active.id);
    const overIndex = reordered.findIndex((task) => task.id === over.id);
    const lastInDay = reordered.reduce((last, task, index) => task.scheduledDate === targetDate ? index : last, -1);
    reordered.splice(overIndex >= 0 ? overIndex : lastInDay >= 0 ? lastInDay + 1 : reordered.length, 0, moving);
    void data.reorderTasks(reordered);
  }

  function confirmDelete(task: Task) {
    if (window.confirm(`Supprimer « ${task.title} » ?`)) void data.removeTask(task.id);
  }

  if (sessionLoading) return <main className="loading-screen"><LoaderCircle /><span>Ouverture de Sept Jours…</span></main>;
  if (isSupabaseConfigured && !session) return <AuthScreen />;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup"><span className="brand-mark" aria-hidden="true"><Check size={17} strokeWidth={2.4} /></span><span className="brand-name">Sept Jours</span></div>
        <div className="topbar-date"><span className="eyebrow">Ma semaine</span><strong>{formatWeekRange(days)}</strong></div>
        <div className="topbar-actions">
          <span className={`sync-state sync-${data.syncState}`} title={data.error ?? undefined}><SyncIcon size={14} /> {sync.text}</span>
          <Button variant="outline" className="notes-button" onClick={() => setView(view === 'week' ? 'notes' : 'week')}><BookOpenText /> {view === 'week' ? 'Past Notes' : 'Ma semaine'}</Button>
          {session && <Button variant="ghost" size="icon" aria-label="Se déconnecter" title="Se déconnecter" onClick={() => void supabase?.auth.signOut()}><LogOut /></Button>}
        </div>
      </header>

      {!isSupabaseConfigured && <div className="demo-banner">Mode démonstration — configurez Supabase pour activer la synchronisation privée.</div>}

      {view === 'notes' ? <PastNotes notes={data.notes} today={today} onBack={() => setView('week')} onChange={data.changeNote} onDelete={(id) => void data.removeNote(id)} /> : <>
        <EventCountdown today={today} events={data.events.filter((event) => event.date >= today).slice(0, 3)} onAdd={(name, date) => void data.addEvent(name, date)} onDelete={(id) => void data.removeEvent(id)} />
        <section className="intro-row"><blockquote><p>« {verse.text} »</p><a href={verse.href} target="_blank" rel="noreferrer">{verse.reference}</a></blockquote></section>
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <nav className="mobile-day-picker" aria-label="Choisir un jour">{days.map((day) => <DayTab key={day.date} day={day} selected={selectedDate === day.date} onSelect={() => setSelectedDate(day.date)} />)}</nav>
          <section className="week-board" aria-label="Tâches des sept prochains jours">
            {days.map((day) => <DayColumn key={day.date} day={day} tasks={visibleTasks[day.date] ?? []} appointments={visibleAppointments[day.date] ?? []} note={data.notes.find((note) => note.date === day.date)?.text ?? ''} selected={day.date === selectedDate} onSelect={() => setSelectedDate(day.date)} onToggle={(id) => void data.toggleTask(id)} onPriorityChange={(id, priority) => void data.updateTask(id, { priority })} onRename={(id, title) => void data.updateTask(id, { title })} onDelete={(id) => { const task = data.tasks.find((item) => item.id === id); if (task) confirmDelete(task); }} onMoveTomorrow={(id) => { const task = data.tasks.find((item) => item.id === id); if (task) void data.updateTask(id, { scheduledDate: addCalendarDays(task.scheduledDate, 1) }); }} onAdd={(date, title, priority) => void data.addTask(date, title, priority)} onAppointmentAdd={(date, time, description) => void data.addAppointment(date, time, description)} onAppointmentToggle={(id) => void data.toggleAppointment(id)} onAppointmentDelete={(id) => void data.removeAppointment(id)} onNoteChange={(text) => data.changeNote(day.date, text)} />)}
          </section>
        </DndContext>
      </>}

      {data.loading && <div className="loading-overlay"><LoaderCircle /> Chargement…</div>}
    </main>
  );
}
