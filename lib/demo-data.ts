import type { Day, Task } from '@/lib/types';
export type { Day, Priority, Task } from '@/lib/types';

export const demoDays: Day[] = [
  { date: '2026-09-07', label: 'Lundi', shortLabel: 'L', dayNumber: '7', month: 'sept.', isToday: true },
  { date: '2026-09-08', label: 'Mardi', shortLabel: 'M', dayNumber: '8', month: 'sept.' },
  { date: '2026-09-09', label: 'Mercredi', shortLabel: 'M', dayNumber: '9', month: 'sept.' },
  { date: '2026-09-10', label: 'Jeudi', shortLabel: 'J', dayNumber: '10', month: 'sept.' },
  { date: '2026-09-11', label: 'Vendredi', shortLabel: 'V', dayNumber: '11', month: 'sept.' },
  { date: '2026-09-12', label: 'Samedi', shortLabel: 'S', dayNumber: '12', month: 'sept.' },
  { date: '2026-09-13', label: 'Dimanche', shortLabel: 'D', dayNumber: '13', month: 'sept.' },
];

const basicDemoTasks: Array<Pick<Task, 'id' | 'title' | 'scheduledDate' | 'priority' | 'isCompleted'>> = [
  { id: 'task-01', title: 'Envoyer le dossier final', scheduledDate: '2026-09-07', priority: 'red', isCompleted: false },
  { id: 'task-02', title: 'Préparer le cours de jeudi', scheduledDate: '2026-09-07', priority: 'yellow', isCompleted: false },
  { id: 'task-03', title: 'Répondre à Sophie', scheduledDate: '2026-09-07', priority: 'green', isCompleted: true },
  { id: 'task-04', title: 'Réserver le train', scheduledDate: '2026-09-07', priority: 'yellow', isCompleted: true },
  { id: 'task-05', title: 'Passer à la librairie', scheduledDate: '2026-09-07', priority: 'green', isCompleted: false },
  { id: 'task-06', title: 'Relire la présentation', scheduledDate: '2026-09-08', priority: 'red', isCompleted: false },
  { id: 'task-07', title: 'Appeler le cabinet', scheduledDate: '2026-09-08', priority: 'yellow', isCompleted: false },
  { id: 'task-08', title: 'Envoyer le mail', scheduledDate: '2026-09-09', priority: 'green', isCompleted: false },
  { id: 'task-09', title: 'Déjeuner avec Camille', scheduledDate: '2026-09-10', priority: 'yellow', isCompleted: false },
  { id: 'task-10', title: 'Finaliser les notes', scheduledDate: '2026-09-10', priority: 'red', isCompleted: false },
  { id: 'task-11', title: 'Faire le point hebdo', scheduledDate: '2026-09-11', priority: 'yellow', isCompleted: false },
  { id: 'task-12', title: 'Marché du quartier', scheduledDate: '2026-09-12', priority: 'green', isCompleted: false },
  { id: 'task-13', title: 'Appeler maman', scheduledDate: '2026-09-13', priority: 'green', isCompleted: false },
];

export const demoTasks: Task[] = basicDemoTasks.map((task, index) => ({
  ...task,
  completedAt: task.isCompleted ? '2026-09-07T09:00:00.000Z' : null,
  sortOrder: index,
  createdAt: '2026-09-07T08:00:00.000Z',
  updatedAt: '2026-09-07T09:00:00.000Z',
}));
