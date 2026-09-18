'use client';

import { useState } from 'react';
import { CalendarHeart, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { UpcomingEvent } from '@/lib/types';
import { EVENT_TITLE_PLACEHOLDER } from '@/lib/event-form';

function daysBetween(from: string, to: string) {
  const parts = (value: string) => value.split('-').map(Number);
  const [fromYear, fromMonth, fromDay] = parts(from);
  const [toYear, toMonth, toDay] = parts(to);
  return Math.max(0, Math.ceil((Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) / 86_400_000));
}

export function EventCountdown({ today, events, onAdd, onDelete }: { today: string; events: UpcomingEvent[]; onAdd: (name: string, date: string) => void; onDelete: (id: string) => void }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [open, setOpen] = useState(false);

  function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !date || date <= today || events.length >= 3) return;
    onAdd(name.trim(), date);
    setName(''); setDate(''); setOpen(false);
  }

  return (
    <section className="countdown-strip" aria-label="Compteurs d’événements">
      <div className="countdown-label"><CalendarHeart /><span>À venir</span></div>
      <div className="countdown-events">
        {events.map((event) => <div className="countdown-event" key={event.id}><strong>{daysBetween(today, event.date)}</strong><span>jours avant<br /><b>{event.name}</b></span><button type="button" onClick={() => onDelete(event.id)} aria-label={`Supprimer le compteur ${event.name}`}><Trash2 /></button></div>)}
      </div>
      {events.length < 3 && <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="ghost" size="sm" className="add-countdown" />}><Plus /> Ajouter un événement</DialogTrigger>
        <DialogContent className="countdown-dialog">
          <DialogHeader><DialogTitle>Nouvel événement</DialogTitle><DialogDescription>Ajoutez une date que vous avez hâte de voir arriver. Trois compteurs maximum.</DialogDescription></DialogHeader>
          <form id="countdown-form" onSubmit={submit} className="countdown-form">
            <label htmlFor="event-name">Titre de l’événement</label><Input id="event-name" value={name} onChange={(event) => setName(event.target.value)} placeholder={EVENT_TITLE_PLACEHOLDER} />
            <label htmlFor="event-date">Date</label><Input id="event-date" type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)} />
          </form>
          <DialogFooter><DialogClose render={<Button variant="ghost" />}>Annuler</DialogClose><Button form="countdown-form" type="submit">Ajouter</Button></DialogFooter>
        </DialogContent>
      </Dialog>}
    </section>
  );
}
