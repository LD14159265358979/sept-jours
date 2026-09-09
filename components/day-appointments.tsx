import { useState } from 'react';
import { Clock3, Plus, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { MAX_APPOINTMENTS_PER_DAY } from '@/lib/appointments';
import type { Appointment } from '@/lib/types';

type Props = {
  date: string;
  appointments: Appointment[];
  onAdd: (date: string, time: string, description: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export function DayAppointments({ date, appointments, onAdd, onToggle, onDelete }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [time, setTime] = useState('09:00');
  const [description, setDescription] = useState('');
  const isFull = appointments.length >= MAX_APPOINTMENTS_PER_DAY;

  function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!time || !description.trim() || isFull) return;
    onAdd(date, time, description.trim());
    setDescription('');
    setIsAdding(false);
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
              <button type="button" onClick={() => onDelete(appointment.id)} aria-label={`Supprimer le rendez-vous ${appointment.description}`} title="Supprimer">
                <Trash2 aria-hidden="true" />
              </button>
            </div>
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
