'use client';

import { useState } from 'react';
import { Bell, Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TaskItem } from '@/components/task-item';
import { DayAppointments } from '@/components/day-appointments';
import type { Appointment, CalendarEvent, Day, Priority, Task } from '@/lib/types';

type Props = { day: Day; tasks: Task[]; appointments: Appointment[]; reminders: CalendarEvent[]; note: string; selected: boolean; onSelect: () => void; onToggle: (id: string) => void; onPriorityChange: (id: string, priority: Priority) => void; onRename: (id: string, title: string) => void; onDelete: (id: string) => void; onMoveTomorrow: (id: string) => void; onAdd: (date: string, title: string, priority: Priority) => void; onAppointmentAdd: (date: string, time: string, description: string) => void; onAppointmentUpdate: (id: string, time: string, description: string) => void; onAppointmentToggle: (id: string) => void; onAppointmentDelete: (id: string) => void; onNoteChange: (value: string) => void };

export function DayColumn({ day, tasks, appointments, reminders, note, selected, onSelect, onToggle, onPriorityChange, onRename, onDelete, onMoveTomorrow, onAdd, onAppointmentAdd, onAppointmentUpdate, onAppointmentToggle, onAppointmentDelete, onNoteChange }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('yellow');
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day.date}`, data: { type: 'day', scheduledDate: day.date } });

  function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    onAdd(day.date, title.trim(), priority);
    setTitle('');
    setIsAdding(false);
  }

  return (
    <article ref={setNodeRef} className={`day-column ${day.isToday ? 'is-today' : ''} ${selected ? 'is-selected' : ''} ${isOver ? 'is-drop-target' : ''}`}>
      <header className="day-header">
        <div><span className="eyebrow">{day.label}</span>{day.isToday && <em>Aujourd’hui</em>}</div>
        <p><strong>{day.dayNumber}</strong> {day.month}</p>
      </header>
      {reminders.length > 0 && <div className="day-reminders" aria-label={`Rappels du ${day.date}`}>{reminders.map((event) => <div key={event.id}><Bell aria-hidden="true" /><span>{event.reminderText}</span></div>)}</div>}
      <DayAppointments date={day.date} appointments={appointments} onAdd={onAppointmentAdd} onUpdate={onAppointmentUpdate} onToggle={onAppointmentToggle} onDelete={onAppointmentDelete} />
      <div className="task-section-heading">
        <span>Tâches</span>
        {!isAdding && <button className="compact-add quick-add" type="button" onClick={() => { onSelect(); setIsAdding(true); }} aria-label={`Ajouter une tâche pour ${day.label}`} title="Ajouter une tâche"><Plus aria-hidden="true" /></button>}
      </div>
      {isAdding && (
        <form className="quick-add-form" onSubmit={submit}>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nouvelle tâche…" aria-label={`Nouvelle tâche pour ${day.label}`} />
          <div className="priority-picker" aria-label="Priorité">
            {(['red', 'yellow', 'green'] as Priority[]).map((value) => <button key={value} type="button" className={`priority-dot priority-${value} ${priority === value ? 'is-active' : ''}`} onClick={() => setPriority(value)} aria-label={`Priorité ${value}`} />)}
            <button className="cancel-task-add" type="button" onClick={() => setIsAdding(false)}>Annuler</button>
            <Button size="sm" type="submit">Ajouter</Button>
          </div>
        </form>
      )}
      <div className="task-list">
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.length ? tasks.map((task) => <TaskItem key={task.id} task={task} onToggle={onToggle} onPriorityChange={onPriorityChange} onRename={onRename} onDelete={onDelete} onMoveTomorrow={onMoveTomorrow} />) : <p className="empty-day">Rien de prévu.<br />La journée respire.</p>}
        </SortableContext>
      </div>
      <div className="daily-note">
        <div><span>Note du jour</span></div>
        <Textarea value={note} onChange={(event) => onNoteChange(event.target.value)} placeholder="Une pensée à garder pour cette journée…" />
      </div>
    </article>
  );
}
