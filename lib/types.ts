export type Priority = 'red' | 'yellow' | 'green';

export type Task = {
  id: string;
  userId?: string;
  title: string;
  scheduledDate: string;
  priority: Priority;
  isCompleted: boolean;
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type DailyNote = {
  id: string;
  userId?: string;
  date: string;
  text: string;
  createdAt: string;
  updatedAt: string;
};

export type UpcomingEvent = {
  id: string;
  userId?: string;
  name: string;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type Appointment = {
  id: string;
  userId?: string;
  date: string;
  time: string;
  description: string;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Day = {
  date: string;
  label: string;
  shortLabel: string;
  dayNumber: string;
  month: string;
  isToday?: boolean;
};
