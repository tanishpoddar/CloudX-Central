import { getAllTasks, getAllUsers } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';
import TasksClient from './tasks-client';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function TasksLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default async function TasksPage() {
  const currentUser = await getCurrentUser();
  const users = await getAllUsers();
  const allTasks = await getAllTasks();

  if (!currentUser) return null;

  return (
    <Suspense fallback={<TasksLoading />}>
      <TasksClient currentUser={currentUser} users={users} allTasks={allTasks} />
    </Suspense>
  );
}
