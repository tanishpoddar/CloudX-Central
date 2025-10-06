
import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  ListTodo,
  Users,
  XCircle,
  Rss,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getCurrentUser } from '@/lib/auth';
import { TaskChart } from './task-chart';
import { getAllTasks, getAllUsers, getAllLogs, getAnnouncements } from '@/lib/data';
import type { Task, User, Log } from '@/types';
import { getSubordinates } from '@/lib/hierarchy';
import { formatDistanceToNow } from 'date-fns';

export default async function Dashboard() {
  const user = await getCurrentUser();

  if (!user) return null;

  const [users, tasks, allLogs, announcements] = await Promise.all([
    getAllUsers(),
    getAllTasks(),
    getAllLogs(),
    getAnnouncements(),
  ]);

  const myTasks = tasks.filter(t => (t.assignedToIds || []).includes(user.id));
  const teamTasks = tasks.filter(t => {
    if (!t.assignedToIds || t.assignedToIds.length === 0) return false;
    const taskTeam = users.find(u => u.id === t.assignedToIds![0])?.team;
    return taskTeam === user.team && !t.assignedToIds.includes(user.id);
  });

  const getVisibleLogs = async (currentUser: User, logs: Log[], allUsers: User[]): Promise<Log[]> => {
    const { role, id } = currentUser;

    if (role === 'Co-founder' || role === 'Secretary') {
      return logs;
    }

    const subordinateIds = await getSubordinates(id, allUsers);
    const visibleUserIds = new Set([id, ...subordinateIds]);

    return logs.filter(log => {
      // Show logs created by the user or their subordinates
      if (visibleUserIds.has(log.userId)) {
          return true;
      }
      
      // Show logs for announcements visible to the user
      if (log.message.toLowerCase().includes('announcement')) {
          // This is a simplification; for now, we assume if they can see the log section, they can see announcement logs.
          // A more robust implementation would check if the announcement itself is visible.
          return true;
      }

      return false;
    });
  };

  const visibleLogs = await getVisibleLogs(user, allLogs, users);

  const recentLogs = visibleLogs.slice(0, 5).map(log => {
      const logUser = users.find(u => u.id === log.userId);
      return {...log, userName: logUser?.name, userAvatar: logUser?.avatar}
  });

  const chartData = [
    { name: 'To Do', total: tasks.filter(t => t.status === 'To Do').length, fill: 'hsl(var(--chart-2))' },
    { name: 'In Progress', total: tasks.filter(t => t.status === 'In Progress').length, fill: 'hsl(var(--chart-4))' },
    { name: 'Done', total: tasks.filter(t => t.status === 'Done').length, fill: 'hsl(var(--chart-1))' },
  ];

  const canPostAnnouncement = ['Co-founder', 'Secretary', 'Chair of Directors'].includes(user.role);

  const enrichedAnnouncements = announcements.map(announcement => {
      const author = users.find(u => u.id === announcement.authorId);
      return {
          ...announcement,
          authorName: author?.name || 'System',
          authorAvatar: author?.avatar
      };
  });

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2">
              <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
                  <ListTodo className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{myTasks.length}</div>
                  <p className="text-xs text-muted-foreground">
                  {myTasks.filter(t => t.status === 'To Do').length} pending
                  </p>
              </CardContent>
              </Card>
              <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Team Tasks</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{teamTasks.length}</div>
                  <p className="text-xs text-muted-foreground">Across your teams and leads</p>
              </CardContent>
              </Card>
              <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">+{tasks.filter(t => t.status === 'Done').length}</div>
                  <p className="text-xs text-muted-foreground">
                  Total tasks completed
                  </p>
              </CardContent>
              </Card>
              <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'In Progress').length}</div>
                  <p className="text-xs text-muted-foreground">Tasks currently in progress</p>
              </CardContent>
              </Card>
          </div>
        </div>
        <Card className="xl:col-span-2 glass">
           <CardHeader>
              <CardTitle className="flex items-center gap-2"><Rss /> Recent Announcements</CardTitle>
              <CardDescription>
                The latest updates from the organization leadership.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 max-h-48 overflow-y-auto">
                {enrichedAnnouncements.slice(0, 3).map(announcement => (
                    <div key={announcement.id} className="flex items-start gap-4">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={announcement.authorAvatar} alt={announcement.authorName} />
                            <AvatarFallback>{announcement.authorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                             <Link href={`/dashboard/announcements#${announcement.id}`} className="hover:underline">
                                <p className="text-sm font-medium">{announcement.title}</p>
                            </Link>
                            <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                        </div>
                    </div>
                ))}
                 {enrichedAnnouncements.length === 0 && (
                    <div className="text-center text-muted-foreground">No recent announcements.</div>
                )}
              </div>
                <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard/announcements">View All Announcements</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2 glass">
          <CardHeader>
            <CardTitle>Task Overview</CardTitle>
            <CardDescription>A summary of all tasks by status.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             <TaskChart data={chartData} />
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Updates on tasks from you and your team.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {recentLogs.length > 0 ? recentLogs.map(log => (
                <div key={log.id} className="flex items-center gap-4">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                        <AvatarImage src={log.userAvatar} alt="Avatar" data-ai-hint="person portrait" />
                        <AvatarFallback>{log.userName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                        <p className="text-sm font-medium leading-none" dangerouslySetInnerHTML={{ __html: log.userName || 'System' }} />
                        <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: log.message.length > 50 ? `${log.message.substring(0,50)}...` : log.message }} />
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleDateString()}
                    </div>
                </div>
            )) : (
              <div className="text-center text-muted-foreground">No recent activity.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
