'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  DragDropContext,
  DropResult,
} from '@hello-pangea/dnd';
import type { Task, User, TaskStatus } from '@/types';
import { KanbanColumn } from './kanban-column';
import { updateTaskStatus } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { getSubordinates } from '@/lib/hierarchy';
import { Skeleton } from '@/components/ui/skeleton';

type AssigneeInfo = { name: string; avatar?: string | undefined };

type EnrichedTask = Task & { 
  assignees: AssigneeInfo[];
};

type ColumnData = {
  id: TaskStatus;
  title: string;
  taskIds: string[];
};

type BoardState = {
  tasks: Record<string, EnrichedTask>;
  columns: Record<TaskStatus, ColumnData>;
  columnOrder: TaskStatus[];
};

export default function KanbanBoard({
  initialTasks,
  users,
  currentUser,
}: {
  initialTasks: Task[];
  users: User[];
  currentUser: User;
}) {
  const { toast } = useToast();
  const [isTransitioning, startTransition] = useTransition();
  const [boardState, setBoardState] = useState<BoardState | null>(null);

  useEffect(() => {
    async function setupBoard() {
      const { role, id } = currentUser;
      let visibleTasks: Task[] = [];

      if (role === 'Co-founder' || role === 'Secretary') {
        visibleTasks = initialTasks;
      } else if (role === 'Member') {
        visibleTasks = initialTasks.filter(task => task.assignedToIds?.includes(id));
      } else if (role === 'Chair of Directors' || role === 'Lead') {
        const subordinateIds = await getSubordinates(id, users);
        const teamMemberIds = new Set([id, ...subordinateIds]);
        visibleTasks = initialTasks.filter(task => 
          task.assignedToIds?.some(assigneeId => teamMemberIds.has(assigneeId)) || task.assignedById === id
        );
      }
      
      const enrichedTasks = visibleTasks.map(task => {
        const assignees = users
          .filter(u => task.assignedToIds?.includes(u.id))
          .map(u => ({
            name: u.name,
            avatar: u.avatar ?? undefined,  // convert null to undefined here
          }));
        
        return {
          ...task,
          assignees: assignees.length > 0 ? assignees : [{ name: 'Unassigned', avatar: undefined }],
        };
      });

      const tasksById = enrichedTasks.reduce((acc, task) => {
        acc[task.id] = task;
        return acc;
      }, {} as Record<string, EnrichedTask>);

      const columns: Record<TaskStatus, ColumnData> = {
        'To Do': { id: 'To Do', title: 'To Do', taskIds: [] },
        'In Progress': { id: 'In Progress', title: 'In Progress', taskIds: [] },
        'Done': { id: 'Done', title: 'Done', taskIds: [] },
        'Cancelled': { id: 'Cancelled', title: 'Cancelled', taskIds: [] },
      };

      enrichedTasks.forEach(task => {
        if (columns[task.status]) {
          columns[task.status].taskIds.push(task.id);
        }
      });
      
      const columnOrder: TaskStatus[] = ['To Do', 'In Progress', 'Done'];

      setBoardState({
        tasks: tasksById,
        columns,
        columnOrder,
      });
    }

    setupBoard();
  }, [currentUser, users, initialTasks]);

  
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || !boardState) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const startColumn = boardState.columns[source.droppableId as TaskStatus];
    const endColumn = boardState.columns[destination.droppableId as TaskStatus];
    const task = boardState.tasks[draggableId];

    if (!task.assignedToIds?.includes(currentUser.id)) {
        toast({
            variant: "destructive",
            title: "Permission Denied",
            description: "You can only change the status of tasks assigned to you.",
        });
        return;
    }

    // Optimistic UI update
    const originalState = boardState;
    let newBoardState = { ...originalState };

    if (startColumn === endColumn) {
        const newTaskIds = Array.from(startColumn.taskIds);
        newTaskIds.splice(source.index, 1);
        newTaskIds.splice(destination.index, 0, draggableId);

        const newColumn = { ...startColumn, taskIds: newTaskIds };
        newBoardState.columns[startColumn.id] = newColumn;
    } else {
        const startTaskIds = Array.from(startColumn.taskIds);
        startTaskIds.splice(source.index, 1);
        const newStartColumn = { ...startColumn, taskIds: startTaskIds };

        const endTaskIds = Array.from(endColumn.taskIds);
        endTaskIds.splice(destination.index, 0, draggableId);
        const newEndColumn = { ...endColumn, taskIds: endTaskIds };
        
        newBoardState.columns[newStartColumn.id] = newStartColumn;
        newBoardState.columns[newEndColumn.id] = newEndColumn;
        newBoardState.tasks[draggableId].status = destination.droppableId as TaskStatus;
    }
    
    setBoardState(newBoardState);

    startTransition(async () => {
        try {
            const formData = new FormData();
            formData.append('taskId', draggableId);
            formData.append('status', destination.droppableId as TaskStatus);
            await updateTaskStatus(formData);

            toast({
                title: "Task Updated",
                description: `Moved "${boardState.tasks[draggableId].title}" to ${destination.droppableId}.`,
            });
        } catch (error) {
            setBoardState(originalState); // Revert on error
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error instanceof Error ? error.message : "Could not update task status.",
            });
        }
    });
  };

  if (!boardState) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            ))}
        </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        {boardState.columnOrder.map(columnId => {
          const column = boardState.columns[columnId];
          const tasks = column.taskIds.map(taskId => boardState.tasks[taskId]);

          return (
            <KanbanColumn key={column.id} column={column} tasks={tasks} />
          );
        })}
      </div>
    </DragDropContext>
  );
}