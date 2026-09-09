import type { Appointment } from '@/lib/types';

export const MAX_APPOINTMENTS_PER_DAY = 3;

export function canAddAppointment(appointments: Appointment[], date: string) {
  return appointments.filter((appointment) => appointment.date === date).length < MAX_APPOINTMENTS_PER_DAY;
}
