import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getCurrentUser } from '@/lib/auth';
import type { User, Log, Task } from '@/types';
import { getAllUsers, getAllTasks, getAllLogs } from '@/lib/data';
import { getSubordinates } from '@/lib/hierarchy';


export default async function LogsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const users = await getAllUsers();
  const tasks = await getAllTasks();
  const allLogs = await getAllLogs();

  const getVisibleLogs = async () => {
    const userRole = currentUser.role;

    // Presidium can see all logs
    if (userRole === 'Co-founder' || userRole === 'Secretary') {
      return allLogs;
    }
    
    // Logs for actions taken by the current user
    const logsByMe = allLogs.filter(log => log.userId === currentUser.id);

    // Get tasks where the user is either the assignee or the assigner
    const myInvolvedTasks = tasks.filter(t => (t.assignedToIds || []).includes(currentUser.id) || t.assignedById === currentUser.id);
    const myInvolvedTaskIds = myInvolvedTasks.map(t => t.id);

    // Get logs related to those tasks
    const logsAboutMyTasks = allLogs.filter(log => log.taskId && myInvolvedTaskIds.includes(log.taskId));
    
    let subordinateLogs: Log[] = [];

    // If the user is a manager, get logs from their subordinates
    if (userRole === 'Chair of Directors' || userRole === 'Lead') {
      const subordinateIds = await getSubordinates(currentUser.id, users);
      subordinateLogs = allLogs.filter(log => subordinateIds.includes(log.userId));
    }
    
    // Combine and deduplicate
    const relevantLogs = [...logsAboutMyTasks, ...logsByMe, ...subordinateLogs];
    const uniqueLogIds = new Set(relevantLogs.map(l => l.id));
    
    return Array.from(uniqueLogIds).map(id => relevantLogs.find(l => l.id === id)!);
  };

  const filteredLogs = await getVisibleLogs();


  const enrichedLogs = filteredLogs
    .map(log => {
      const user = users.find(u => u.id === log.userId);
      return {
        ...log,
        userName: user?.name || 'System',
        userAvatar: user?.avatar,
      };
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Logs</CardTitle>
        <CardDescription>
          A history of relevant actions and updates based on your role.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-4">
            {enrichedLogs.map((log, index) => (
              <div key={log.id}>
                <div className="flex items-start gap-4 p-4">
                    <Avatar className="h-10 w-10">
                    <AvatarImage src={log.userAvatar} alt={log.userName} />
                    <AvatarFallback>
                        {log.userName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold">{log.userName}</p>
                        <p className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                        </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {log.message}
                    </p>
                    </div>
                </div>
                {index < enrichedLogs.length - 1 && <Separator />}
              </div>
            ))}
             {enrichedLogs.length === 0 && (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                    No logs to display.
                </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
