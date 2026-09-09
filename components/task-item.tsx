'use client';

import { useState } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { CalendarPlus, Check, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Priority, Task } from '@/lib/types';

const priorityLabels: Record<Priority, string> = { red: 'Urgent', yellow: 'Priorité moyenne', green: 'Peut attendre' };
const priorityNames: Record<Priority, string> = { red: 'Rouge · urgent', yellow: 'Jaune · moyen', green: 'Vert · peut attendre' };

type Props = { task: Task; onToggle: (id: string) => void; onPriorityChange: (id: string, priority: Priority) => void; onRename: (id: string, title: string) => void; onDelete: (id: string) => void; onMoveTomorrow: (id: string) => void };

export function TaskItem({ task, onToggle, onPriorityChange, onRename, onDelete, onMoveTomorrow }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { type: 'task', scheduledDate: task.scheduledDate } });

  function saveTitle() {
    if (title.trim()) onRename(task.id, title.trim()); else setTitle(task.title);
    setIsEditing(false);
  }

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`task-item priority-${task.priority} ${task.isCompleted ? 'is-completed' : ''} ${isDragging ? 'is-dragging' : ''}`} {...attributes} {...listeners}>
      <span className="task-check" onPointerDown={(event) => event.stopPropagation()}><Checkbox checked={task.isCompleted} onCheckedChange={() => onToggle(task.id)} aria-label={`${task.isCompleted ? 'Rouvrir' : 'Terminer'} : ${task.title}`} /></span>
      <div className="task-copy">
        {isEditing ? <Input value={title} onChange={(event) => setTitle(event.target.value)} onBlur={saveTitle} onPointerDown={(event) => event.stopPropagation()} onKeyDown={(event) => { if (event.key === 'Enter') saveTitle(); if (event.key === 'Escape') { setTitle(task.title); setIsEditing(false); } }} /> : <span>{task.title}</span>}
        <small><i /> {priorityLabels[task.priority]}</small>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger render={<button className="task-menu" type="button" aria-label={`Options pour ${task.title}`} onPointerDown={(event) => event.stopPropagation()} />}><MoreHorizontal /></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="task-dropdown">
          <DropdownMenuItem onClick={() => setIsEditing(true)}><Pencil /> Modifier le texte</DropdownMenuItem>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Changer la priorité</DropdownMenuLabel>
            {(['red', 'yellow', 'green'] as Priority[]).map((priority) => <DropdownMenuItem key={priority} onClick={() => onPriorityChange(task.id, priority)}><span className={`menu-priority priority-${priority}`} />{priorityNames[priority]}{task.priority === priority && <Check className="menu-check" />}</DropdownMenuItem>)}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onMoveTomorrow(task.id)}><CalendarPlus /> Reporter à demain</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(task.id)}><Trash2 /> Supprimer</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
