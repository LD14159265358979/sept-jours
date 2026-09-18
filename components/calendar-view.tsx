'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Bell, ChevronLeft, ChevronRight, Plus, Repeat2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { calendarEventsForDate, monthGrid, shiftMonth } from '@/lib/calendar-events';
import { parseCalendarDate } from '@/lib/date-utils';
import type { CalendarEvent, CalendarRecurrence } from '@/lib/types';

type NewCalendarEvent = Pick<CalendarEvent, 'title' | 'startDate' | 'time' | 'recurrence' | 'recurrenceEndDate' | 'reminderText'>;

type Props = {
  today: string;
  events: CalendarEvent[];
  onBack: () => void;
  onAdd: (event: NewCalendarEvent) => void;
  onSkipOccurrence: (id: string, date: string) => void;
  onDelete: (id: string) => void;
};

const weekdayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function displayMonth(value: string) {
  const label = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(parseCalendarDate(value));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function displayLongDate(value: string) {
  const label = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(parseCalendarDate(value));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function CalendarView({ today, events, onBack, onAdd, onSkipOccurrence, onDelete }: Props) {
  const [month, setMonth] = useState(today.slice(0, 7) + '-01');
  const [selectedDate, setSelectedDate] = useState(today);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('18:00');
  const [recurrence, setRecurrence] = useState<CalendarRecurrence>('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderText, setReminderText] = useState('');
  const days = useMemo(() => monthGrid(month), [month]);
  const eventsByDate = useMemo(() => Object.fromEntries(days.map((day) => [day, calendarEventsForDate(events, day)])), [days, events]);
  const selectedEvents = eventsByDate[selectedDate] ?? calendarEventsForDate(events, selectedDate);
  const recurringEvents = events.filter((event) => event.recurrence === 'weekly');

  function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !date || !time || (hasReminder && !reminderText.trim())) return;
    onAdd({
      title: title.trim(),
      startDate: date,
      time,
      recurrence,
      recurrenceEndDate: recurrence === 'weekly' && recurrenceEndDate ? recurrenceEndDate : null,
      reminderText: hasReminder ? reminderText.trim() : null,
    });
    setTitle('');
    setDate(today);
    setTime('18:00');
    setRecurrence('none');
    setRecurrenceEndDate('');
    setHasReminder(false);
    setReminderText('');
    setDialogOpen(false);
  }

  function changeMonth(direction: -1 | 1) {
    const next = shiftMonth(month, direction);
    setMonth(next);
    setSelectedDate(next);
  }

  function returnToToday() {
    setMonth(today.slice(0, 7) + '-01');
    setSelectedDate(today);
  }

  function removeOccurrence(event: CalendarEvent, occurrenceDate: string) {
    if (event.recurrence === 'weekly') {
      if (window.confirm(`Retirer « ${event.title} » uniquement le ${displayLongDate(occurrenceDate).toLowerCase()} ?`)) onSkipOccurrence(event.id, occurrenceDate);
      return;
    }
    if (window.confirm(`Supprimer « ${event.title} » ?`)) onDelete(event.id);
  }

  function removeSeries(event: CalendarEvent) {
    if (window.confirm(`Supprimer toute la série « ${event.title} » ?`)) onDelete(event.id);
  }

  return (
    <section className="calendar-view">
      <div className="calendar-heading">
        <Button variant="ghost" onClick={onBack}><ArrowLeft /> Ma semaine</Button>
        <div><p className="eyebrow">Tous mes rendez-vous</p><h1>Calendrier</h1></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="calendar-add-button" />}><Plus /> Ajouter</DialogTrigger>
          <DialogContent className="calendar-dialog">
            <DialogHeader><DialogTitle>Nouveau rendez-vous</DialogTitle><DialogDescription>Ajoutez une date unique ou un rendez-vous qui revient chaque semaine.</DialogDescription></DialogHeader>
            <form id="calendar-event-form" className="calendar-event-form" onSubmit={submit}>
              <label htmlFor="calendar-event-title">Titre<Input id="calendar-event-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} placeholder="Bébés nageurs" required /></label>
              <div className="calendar-form-row">
                <label htmlFor="calendar-event-date">Date de début<Input id="calendar-event-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
                <label htmlFor="calendar-event-time">Heure<Input id="calendar-event-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} required /></label>
              </div>
              <label htmlFor="calendar-event-recurrence">Répétition<NativeSelect id="calendar-event-recurrence" value={recurrence} onChange={(event) => setRecurrence(event.target.value as CalendarRecurrence)}><NativeSelectOption value="none">Une seule fois</NativeSelectOption><NativeSelectOption value="weekly">Toutes les semaines</NativeSelectOption></NativeSelect></label>
              {recurrence === 'weekly' && <label htmlFor="calendar-event-end">Fin de la série <span>(facultatif)</span><Input id="calendar-event-end" type="date" min={date} value={recurrenceEndDate} onChange={(event) => setRecurrenceEndDate(event.target.value)} /></label>}
              <label className="calendar-reminder-toggle" htmlFor="calendar-event-reminder"><Checkbox id="calendar-event-reminder" checked={hasReminder} onCheckedChange={(checked) => setHasReminder(checked === true)} /><span><strong>Afficher un rappel dans Ma semaine</strong><small>Le rappel apparaîtra sous la date concernée.</small></span></label>
              {hasReminder && <label htmlFor="calendar-event-reminder-text">Intitulé du rappel<Input id="calendar-event-reminder-text" value={reminderText} onChange={(event) => setReminderText(event.target.value)} maxLength={180} placeholder="Préparer le sac de piscine" required /></label>}
            </form>
            <DialogFooter><DialogClose render={<Button variant="ghost" />}>Annuler</DialogClose><Button form="calendar-event-form" type="submit">Ajouter au calendrier</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="calendar-toolbar">
        <button type="button" onClick={() => changeMonth(-1)} aria-label="Mois précédent"><ChevronLeft /></button>
        <h2>{displayMonth(month)}</h2>
        <button type="button" onClick={() => changeMonth(1)} aria-label="Mois suivant"><ChevronRight /></button>
        {month.slice(0, 7) !== today.slice(0, 7) && <button className="calendar-today" type="button" onClick={returnToToday}>Aujourd’hui</button>}
      </div>

      <div className="calendar-layout">
        <div className="month-calendar">
          <div className="calendar-weekdays" aria-hidden="true">{weekdayLabels.map((label) => <span key={label}>{label}</span>)}</div>
          <div className="calendar-grid">
            {days.map((day) => {
              const dayEvents = eventsByDate[day];
              const outsideMonth = day.slice(0, 7) !== month.slice(0, 7);
              return (
                <div className={`calendar-day ${outsideMonth ? 'is-outside' : ''} ${day === today ? 'is-today' : ''} ${day === selectedDate ? 'is-selected' : ''}`} key={day}>
                  <button className="calendar-day-number" type="button" onClick={() => setSelectedDate(day)} aria-label={displayLongDate(day)}>{Number(day.slice(-2))}</button>
                  <div className="calendar-day-events">
                    {dayEvents.slice(0, 3).map((event) => <div className="calendar-event-chip" key={event.id}><span>{event.time}</span><strong>{event.title}</strong>{event.recurrence === 'weekly' && <Repeat2 aria-label="Hebdomadaire" />}<button type="button" onClick={() => removeOccurrence(event, day)} aria-label={`Retirer ${event.title} le ${displayLongDate(day)}`}><X /></button></div>)}
                    {dayEvents.length > 3 && <small>+ {dayEvents.length - 3} autre{dayEvents.length > 4 ? 's' : ''}</small>}
                  </div>
                  {dayEvents.length > 0 && <i className="calendar-event-dot" aria-hidden="true" />}
                </div>
              );
            })}
          </div>
          <div className="calendar-mobile-agenda">
            <h3>{displayLongDate(selectedDate)}</h3>
            {selectedEvents.length ? selectedEvents.map((event) => <article key={event.id}><time>{event.time}</time><div><strong>{event.title}</strong>{event.reminderText && <span><Bell /> {event.reminderText}</span>}</div><button type="button" onClick={() => removeOccurrence(event, selectedDate)} aria-label={`Retirer ${event.title}`}><X /></button></article>) : <p>Aucun rendez-vous ce jour-là.</p>}
          </div>
        </div>

        <aside className="recurring-events-panel">
          <div><Repeat2 /><span><small>Rendez-vous</small><strong>Hebdomadaires</strong></span></div>
          {recurringEvents.length ? recurringEvents.map((event) => <article key={event.id}><div><strong>{event.title}</strong><span>{event.time} · à partir du {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(parseCalendarDate(event.startDate))}</span>{event.reminderText && <small><Bell /> {event.reminderText}</small>}</div><button type="button" onClick={() => removeSeries(event)} aria-label={`Supprimer toute la série ${event.title}`}><Trash2 /></button></article>) : <p>Les rendez-vous qui reviennent chaque semaine apparaîtront ici.</p>}
        </aside>
      </div>
    </section>
  );
}
