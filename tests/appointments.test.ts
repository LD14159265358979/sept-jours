import { describe, expect, it } from 'vitest';
import { canAddAppointment, MAX_APPOINTMENTS_PER_DAY } from '@/lib/appointments';
import type { Appointment } from '@/lib/types';

function appointment(id: string, date: string): Appointment {
  return { id, date, time: '09:00', description: `Rendez-vous ${id}`, isCompleted: false, completedAt: null, createdAt: '2026-09-08T08:00:00Z', updatedAt: '2026-09-08T08:00:00Z' };
}

describe('rendez-vous quotidiens', () => {
  it('autorise au maximum trois rendez-vous pour une même journée', () => {
    const items = [appointment('a', '2026-09-08'), appointment('b', '2026-09-08'), appointment('c', '2026-09-08')];
    expect(MAX_APPOINTMENTS_PER_DAY).toBe(3);
    expect(canAddAppointment(items.slice(0, 2), '2026-09-08')).toBe(true);
    expect(canAddAppointment(items, '2026-09-08')).toBe(false);
  });

  it('compte séparément les rendez-vous de chaque journée', () => {
    const items = [appointment('a', '2026-09-08'), appointment('b', '2026-09-08'), appointment('c', '2026-09-08')];
    expect(canAddAppointment(items, '2026-09-09')).toBe(true);
  });
});
