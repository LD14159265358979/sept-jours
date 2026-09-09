'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { parseCalendarDate } from '@/lib/date-utils';
import type { DailyNote } from '@/lib/types';

function displayDate(value: string) {
  const formatted = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parseCalendarDate(value));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function PastNotes({ notes, today, onBack, onChange, onDelete }: { notes: DailyNote[]; today: string; onBack: () => void; onChange: (date: string, text: string) => void; onDelete: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => notes.filter((note) => note.date < today && note.text.trim() && note.text.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date)), [notes, query, today]);

  function removeNote(note: DailyNote) {
    if (window.confirm(`Supprimer la note du ${displayDate(note.date).toLowerCase()} ?`)) onDelete(note.id);
  }

  return (
    <section className="past-notes-view">
      <div className="past-notes-heading">
        <Button variant="ghost" onClick={onBack}><ArrowLeft /> Ma semaine</Button>
        <div><p className="eyebrow">Archives personnelles</p><h1>Past Notes</h1><p>Les pensées que vous avez choisi de garder, de la plus récente à la plus ancienne.</p></div>
      </div>
      <label className="notes-search" htmlFor="past-notes-search"><Search /><span className="sr-only">Rechercher dans les notes</span><Input id="past-notes-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un mot ou une idée…" /></label>
      <div className="past-notes-list">
        {filtered.map((note) => (
          <article className="past-note-card" key={note.id}>
            <header><div><span className="eyebrow">Note quotidienne</span><h2>{displayDate(note.date)}</h2></div><Button variant="ghost" size="icon" aria-label={`Supprimer la note du ${displayDate(note.date)}`} onClick={() => removeNote(note)}><Trash2 /></Button></header>
            <Textarea value={note.text} onChange={(event) => onChange(note.date, event.target.value)} />
            <footer>Enregistrement automatique</footer>
          </article>
        ))}
        {!filtered.length && <p className="no-notes">Aucune note ne correspond à cette recherche.</p>}
      </div>
    </section>
  );
}
