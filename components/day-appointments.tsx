import { useState } from 'react';
import { Clock3, Pencil, Plus, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { MAX_APPOINTMENTS_PER_DAY } from '@/lib/appointments';
import type { Appointment } from '@/lib/types';

type Props = {
  date: string;
  appointments: Appointment[];
  onAdd: (date: string, time: string, description: string) => void;
  onUpdate: (id: string, time: string, description: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export function DayAppointments({ date, appointments, onAdd, onUpdate, onToggle, onDelete }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [time, setTime] = useState('09:00');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const isFull = appointments.length >= MAX_APPOINTMENTS_PER_DAY;

  function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!time || !description.trim() || isFull) return;
    onAdd(date, time, description.trim());
    setDescription('');
    setIsAdding(false);
  }

  function beginEdit(appointment: Appointment) {
    setEditingId(appointment.id);
    setEditTime(appointment.time);
    setEditDescription(appointment.description);
  }

  function submitEdit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || !editTime || !editDescription.trim()) return;
    onUpdate(editingId, editTime, editDescription.trim());
    setEditingId(null);
  }

  return (
    <section className="appointments" aria-label={`Rendez-vous du ${date}`}>
      <header>
        <span><Clock3 aria-hidden="true" /> Rendez-vous</span>
        <div className="section-actions">
          <small>{appointments.length}/{MAX_APPOINTMENTS_PER_DAY}</small>
          {!isAdding && (
            <button className="compact-add appointment-add" type="button" disabled={isFull} onClick={() => setIsAdding(true)} aria-label={isFull ? 'Maximum de trois rendez-vous atteint' : 'Ajouter un rendez-vous'} title={isFull ? 'Maximum atteint' : 'Ajouter un rendez-vous'}>
              <Plus aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      {appointments.length > 0 && (
        <div className="appointment-list">
          {appointments.map((appointment) => (
            editingId === appointment.id ? (
              <form className="appointment-edit-form" onSubmit={submitEdit} key={appointment.id}>
                <Input type="time" value={editTime} onChange={(event) => setEditTime(event.target.value)} onKeyDown={(event) => event.stopPropagation()} required aria-label="Nouvelle heure du rendez-vous" />
                <Input value={editDescription} onChange={(event) => setEditDescription(event.target.value)} onKeyDown={(event) => event.stopPropagation()} maxLength={180} required aria-label="Nouvelle description du rendez-vous" />
                <div><button type="button" onClick={() => setEditingId(null)}>Annuler</button><button type="submit">Enregistrer</button></div>
              </form>
            ) : (
              <div className={`appointment-item ${appointment.isCompleted ? 'is-completed' : ''}`} key={appointment.id}>
                <Checkbox
                  checked={appointment.isCompleted}
                  onCheckedChange={() => onToggle(appointment.id)}
                  aria-label={`${appointment.isCompleted ? 'Rouvrir' : 'Terminer'} le rendez-vous ${appointment.description}`}
                />
                <div>
                  <time dateTime={`${appointment.date}T${appointment.time}`}>{appointment.time}</time>
                  <span>{appointment.description}</span>
                </div>
                <div className="appointment-item-actions">
                  <button type="button" onClick={() => beginEdit(appointment)} aria-label={`Modifier le rendez-vous ${appointment.description}`} title="Modifier"><Pencil aria-hidden="true" /></button>
                  <button type="button" onClick={() => onDelete(appointment.id)} aria-label={`Supprimer le rendez-vous ${appointment.description}`} title="Supprimer"><Trash2 aria-hidden="true" /></button>
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {isAdding && (
        <form className="appointment-form" onSubmit={submit}>
          <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} required aria-label="Heure du rendez-vous" />
          <Input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={180} placeholder="Avec qui, pour quoi…" required aria-label="Description du rendez-vous" />
          <div>
            <button type="button" onClick={() => setIsAdding(false)}>Annuler</button>
            <button type="submit">Ajouter</button>
          </div>
        </form>
      )}
    </section>
  );
}
