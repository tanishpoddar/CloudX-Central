import { getAllTasks, getAllUsers } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';
import KanbanBoard from './kanban-board';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function BoardPage() {
  const currentUser = await getCurrentUser();
  const users = await getAllUsers();
  const allTasks = await getAllTasks();

  if (!currentUser) return null;

  return (
    <>
      <Card className="glass">
        <CardHeader>
          <CardTitle>Task Board</CardTitle>
          <CardDescription>
            Visualize your workflow. Drag and drop tasks to update their status.
          </CardDescription>
        </CardHeader>
      </Card>
      <KanbanBoard
        initialTasks={allTasks}
        users={users}
        currentUser={currentUser}
      />
    </>
  );
}
