import { getCurrentUser } from '@/lib/auth';
import { getTasksByAssigneeId } from '@/lib/data';
import MyWeekClient from './my-week-client';

export default async function MyWeekPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const tasks = await getTasksByAssigneeId(currentUser.id);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Week</h1>
        <p className="text-muted-foreground">
          A calendar view of your tasks with approaching deadlines.
        </p>
      </div>
      <MyWeekClient tasks={tasks} />
    </div>
  );
}
