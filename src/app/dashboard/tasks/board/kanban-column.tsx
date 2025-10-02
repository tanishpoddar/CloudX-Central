'use client';

import { Droppable } from '@hello-pangea/dnd';
import { KanbanCard } from './kanban-card';
import type { Task, TaskStatus } from '@/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type AssigneeInfo = { name: string; avatar?: string };

type EnrichedTask = Task & { 
    assignees: AssigneeInfo[];
};

type ColumnData = {
  id: TaskStatus;
  title: string;
  taskIds: string[];
};

interface KanbanColumnProps {
  column: ColumnData;
  tasks: EnrichedTask[];
}

const statusColors: Record<TaskStatus, string> = {
    'To Do': 'border-t-yellow-500',
    'In Progress': 'border-t-blue-500',
    'Done': 'border-t-green-500',
    'Cancelled': 'border-t-red-500',
};

export function KanbanColumn({ column, tasks }: KanbanColumnProps) {
  return (
    <div className={cn("flex flex-col h-full", )}>
      <div className={cn("glass rounded-t-lg border-b-0 border-t-4 p-4", statusColors[column.id])}>
        <h3 className="font-semibold text-lg flex items-center justify-between">
          {column.title}
          <span className="text-sm font-normal text-muted-foreground bg-muted h-6 w-6 rounded-full flex items-center justify-center">
            {tasks.length}
          </span>
        </h3>
      </div>
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <ScrollArea 
            className={cn(
                "glass rounded-b-lg p-4 h-[65vh] transition-colors",
                snapshot.isDraggingOver ? 'bg-primary/10' : ''
            )}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            <div className="space-y-4">
              {tasks.map((task, index) => (
                <KanbanCard key={task.id} task={task} index={index} />
              ))}
              {provided.placeholder}
              {tasks.length === 0 && !snapshot.isDraggingOver && (
                <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                  No tasks in this column.
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </Droppable>
    </div>
  );
}
