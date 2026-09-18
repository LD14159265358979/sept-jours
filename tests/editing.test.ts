import { describe, expect, it } from 'vitest';
import { EVENT_TITLE_PLACEHOLDER } from '@/lib/event-form';
import { taskWithTitle } from '@/lib/record-updates';
import type { Task } from '@/lib/types';

describe('édition des tâches', () => {
  it('modifie seulement le texte et updatedAt', () => {
    const original: Task = { id: 'fixed-task-uuid', title: 'Ancien texte', scheduledDate: '2026-09-11', priority: 'red', isCompleted: true, completedAt: '2026-09-11T08:30:00Z', sortOrder: 2, createdAt: '2026-09-10T08:00:00Z', updatedAt: '2026-09-11T08:30:00Z' };
    const changed = taskWithTitle(original, 'Nouveau texte', '2026-09-11T10:00:00Z');
    expect(changed.id).toBe(original.id);
    expect(changed.scheduledDate).toBe(original.scheduledDate);
    expect(changed.priority).toBe(original.priority);
    expect(changed.isCompleted).toBe(true);
    expect(changed.completedAt).toBe(original.completedAt);
    expect(changed.title).toBe('Nouveau texte');
    expect(changed.updatedAt).toBe('2026-09-11T10:00:00Z');
  });
});

describe('formulaire des événements futurs', () => {
  it('distingue clairement le titre de la date', () => {
    expect(EVENT_TITLE_PLACEHOLDER).toBe('Titre de l’événement');
    expect(EVENT_TITLE_PLACEHOLDER.toLocaleLowerCase('fr-FR')).not.toBe('date du terme');
  });
});
