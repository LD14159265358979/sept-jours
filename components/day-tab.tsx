'use client';

import { useDroppable } from '@dnd-kit/core';
import type { Day } from '@/lib/types';

export function DayTab({ day, selected, onSelect }: { day: Day; selected: boolean; onSelect: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `tab-${day.date}`, data: { type: 'day', scheduledDate: day.date } });
  return (
    <button ref={setNodeRef} type="button" className={`${selected ? 'is-selected' : ''} ${isOver ? 'is-drop-target' : ''}`} onClick={onSelect} aria-current={selected ? 'date' : undefined}>
      <span>{day.shortLabel}</span><strong>{day.dayNumber}</strong>{day.isToday && <i aria-label="Aujourd’hui" />}
    </button>
  );
}
