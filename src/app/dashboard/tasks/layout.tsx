
import type { ReactNode } from 'react';
import TasksLayoutClient from './tasks-layout-client';
import { getCurrentUser } from '@/lib/auth';
import { getAllTasks, getAllUsers } from '@/lib/data';

export default async function TasksLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser();
  const allTasks = await getAllTasks();
  const allUsers = await getAllUsers();
  
  if(!currentUser) return null;

  const canCreateTask = ['Co-founder', 'Secretary', 'Chair of Directors', 'Lead'].includes(currentUser.role);
  
  // Filtering logic is now primarily on the client for faster UI response.
  // We pass all tasks and let the client component handle visibility.
  
  const enrichedTasks = allTasks.map(task => {
    const assignees = allUsers.filter(u => (task.assignedToIds || []).includes(u.id));
    const assigner = allUsers.find(u => u.id === task.assignedById);
    return {
      ...task,
      assignees: assignees.length > 0 ? assignees.map(a => a.name) : ['Unassigned'],
      assigner: assigner?.name || 'System',
    };
  });


  return (
    <div className="flex flex-col gap-4">
      <TasksLayoutClient canCreateTask={canCreateTask} tasks={enrichedTasks}>
        {children}
      </TasksLayoutClient>
    </div>
  );
}
