import { describe, expect, it } from 'vitest';
import { addCalendarDays, differenceInCalendarDays, expiredTaskIds, getSevenDayWindow, isTaskExpired, mondayOfWeek } from '@/lib/date-utils';
import type { Task } from '@/lib/types';
import { cleanupPlan } from '@/lib/cleanup';

function task(overrides: Partial<Task> = {}): Task {
  return { id: crypto.randomUUID(), title: 'Envoyer le mail', scheduledDate: '2026-09-01', priority: 'yellow', isCompleted: false, completedAt: null, sortOrder: 0, createdAt: '2026-09-01T08:00:00Z', updatedAt: '2026-09-01T08:00:00Z', ...overrides };
}

describe('fenêtre de sept jours', () => {
  it('contient aujourd’hui et les six jours suivants', () => {
    const days = getSevenDayWindow('2026-09-07');
    expect(days).toHaveLength(7);
    expect(days[0].date).toBe('2026-09-07');
    expect(days[6].date).toBe('2026-09-13');
  });

  it('traverse correctement un changement de mois', () => {
    expect(getSevenDayWindow('2026-01-29').map((day) => day.date)).toEqual(['2026-01-29', '2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02', '2026-02-03', '2026-02-04']);
  });

  it('traverse correctement le 31 décembre', () => {
    expect(addCalendarDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('gère les années bissextiles', () => {
    expect(addCalendarDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addCalendarDays('2028-02-29', 1)).toBe('2028-03-01');
  });

  it('retrouve le lundi stable de la semaine', () => {
    expect(mondayOfWeek('2026-09-07')).toBe('2026-09-07');
    expect(mondayOfWeek('2026-09-13')).toBe('2026-09-07');
  });
});

describe('nettoyage', () => {
  const now = new Date('2026-09-17T14:00:00+02:00');

  it('expire une tâche terminée depuis sept jours', () => {
    expect(isTaskExpired(task({ scheduledDate: '2026-09-15', isCompleted: true, completedAt: '2026-09-10T12:00:00Z' }), now)).toBe(true);
  });

  it('conserve une tâche non terminée prévue depuis moins de trente jours', () => {
    expect(isTaskExpired(task({ scheduledDate: '2026-08-20' }), now)).toBe(false);
  });

  it('expire une tâche plus de trente jours après sa date prévue', () => {
    expect(isTaskExpired(task({ scheduledDate: '2026-08-17' }), now)).toBe(true);
    expect(differenceInCalendarDays('2026-08-17', '2026-09-17')).toBe(31);
  });

  it('ne supprime que l’occurrence expirée parmi deux titres identiques', () => {
    const oldOccurrence = task({ id: 'task-a', scheduledDate: '2026-08-01' });
    const recentOccurrence = task({ id: 'task-b', scheduledDate: '2026-09-10' });
    expect(expiredTaskIds([oldOccurrence, recentOccurrence], now)).toEqual(['task-a']);
  });

  it('ne considère jamais les notes comme expirées', () => {
    const oldNote = { id: 'note-old', date: '2020-01-01', text: 'À conserver', createdAt: '2020-01-01T08:00:00Z', updatedAt: '2020-01-01T08:00:00Z' };
    expect(cleanupPlan([], [oldNote], now).notes).toEqual([oldNote]);
  });
});

describe('report', () => {
  it('conserve l’UUID et change seulement la date métier', () => {
    const original = task({ id: 'fixed-uuid', scheduledDate: '2026-09-07' });
    const moved = { ...original, scheduledDate: addCalendarDays(original.scheduledDate, 1), updatedAt: '2026-09-07T10:00:00Z' };
    expect(moved.id).toBe(original.id);
    expect(moved.scheduledDate).toBe('2026-09-08');
    expect(moved.title).toBe(original.title);
  });
});
