

'use client';

import {
  AlertTriangle,
  Flame,
  Users,
} from 'lucide-react';
import Link from 'next/link';
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
import {
  Tabs,
  TabsContent,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { differenceInHours, format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Task, User } from '@/types';
import { useMemo, useState, useEffect } from 'react';
import { getSubordinates } from '@/lib/hierarchy';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';


export default function TasksClient({ currentUser, users, allTasks: initialTasks }: { currentUser: User, users: User[], allTasks: Task[] }) {
  const [visibleTasks, setVisibleTasks] = useState<Task[] | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFilter = searchParams.get('filter') || 'all';

  const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  
  useEffect(() => {
    async function filterTasks() {
        const { role, id } = currentUser;

        if (role === 'Co-founder' || role === 'Secretary') {
            setVisibleTasks(initialTasks);
            return;
        }

        if (role === 'Member') {
            setVisibleTasks(initialTasks.filter(task => (task.assignedToIds || []).includes(id)));
            return;
        }

        if (role === 'Chair of Directors' || role === 'Lead') {
            const subordinateIds = await getSubordinates(id, users);
            const teamMemberIds = new Set([id, ...subordinateIds]);

            const tasks = initialTasks.filter(task =>
                (task.assignedToIds || []).some(assigneeId => teamMemberIds.has(assigneeId)) ||
                task.assignedById === id
            );
            setVisibleTasks(tasks);
            return;
        }
        
        setVisibleTasks([]);
    }
    filterTasks();
  }, [currentUser, users, initialTasks]);

  const filteredAndEnrichedTasks = useMemo(() => {
    if (!visibleTasks) return null;

    let filtered = visibleTasks;

    switch(currentFilter) {
      case 'active':
        filtered = visibleTasks.filter(t => t.status === 'To Do' || t.status === 'In Progress');
        break;
      case 'missing':
        filtered = visibleTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'Done' && t.status !== 'Cancelled');
        break;
      case 'done':
        filtered = visibleTasks.filter(t => t.status === 'Done' || t.status === 'Cancelled');
        break;
      case 'all':
      default:
        filtered = visibleTasks;
        break;
    }

    return filtered.map(task => {
        const assignees = (task.assignedToIds || [])
            .map(id => userMap.get(id))
            .filter((u): u is User => !!u);
        
        const assigner = userMap.get(task.assignedById);

        return {
            ...task,
            assignees: assignees.length > 0 ? assignees : [{ id: 'unassigned', name: 'Unassigned', email: '', role: 'Member' as const, team: null, subTeam: null, avatar: '', username: '' }],
            assignerName: assigner?.name || 'System',
            assignerAvatar: assigner?.avatar,
            assignerId: assigner?.id,
        }
    });

  }, [visibleTasks, currentFilter, userMap]);


  const statusBadgeVariant = {
    'To Do': 'outline',
    'In Progress': 'secondary',
    'Done': 'default',
    'Cancelled': 'destructive',
  } as const;

  const isDeadlineApproaching = (dueDate: string) => {
    const hoursLeft = differenceInHours(new Date(dueDate), new Date());
    return hoursLeft >= 0 && hoursLeft < 24;
  }

  const renderTable = (tasks: typeof filteredAndEnrichedTasks, loading: boolean) => {
    if(loading || !tasks) {
      return (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      )
    }
    
    return (
        <TooltipProvider>
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignees</TableHead>
                <TableHead>Assigner</TableHead>
                <TableHead className="hidden md:table-cell">Due Date</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {tasks.map(task => {
                const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Done' && task.status !== 'Cancelled';
                return (
                    <TableRow key={task.id} className={cn(isOverdue && 'bg-destructive/20 hover:bg-destructive/30')}>
                        <TableCell className="font-medium">
                            <Link href={`/dashboard/tasks/${task.id}`} className="hover:underline">
                            <div className="flex items-center gap-2">
                                {task.title}
                                {task.urgent && !isOverdue && (
                                <Tooltip>
                                    <TooltipTrigger>
                                    <Flame className="h-4 w-4 text-destructive" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                    <p>This task is marked as urgent.</p>
                                    </TooltipContent>
                                </Tooltip>
                                )}
                            </div>
                            </Link>
                        </TableCell>
                        <TableCell>
                            <Badge variant={statusBadgeVariant[task.status]}>{task.status}</Badge>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center">
                                {task.assignees.slice(0, 2).map((assignee, index) => (
                                    <Tooltip key={assignee.id}>
                                        <TooltipTrigger asChild>
                                            <Link href={`/dashboard/users/${assignee.id}`} className="-ml-2 first:ml-0">
                                                <Avatar className="h-7 w-7 border-2 border-background">
                                                    <AvatarImage src={assignee.avatar ?? undefined} />
                                                    <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{assignee.name}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                                {task.assignees.length > 2 && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="-ml-2">
                                                <Avatar className="h-7 w-7 border-2 border-background bg-muted text-muted-foreground flex items-center justify-center">
                                                    <span className="text-xs">+{task.assignees.length - 2}</span>
                                                </Avatar>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {task.assignees.slice(2).map(a => <p key={a.id}>{a.name}</p>)}
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {task.assignees[0].id === 'unassigned' && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        <span>Unassigned</span>
                                    </div>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            {task.assignerId ? (
                                <Link href={`/dashboard/users/${task.assignerId}`} className="flex items-center gap-2 group">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={task.assignerAvatar ?? undefined} />
                                        <AvatarFallback>{task.assignerName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="group-hover:underline">{task.assignerName}</span>
                                </Link>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback>?</AvatarFallback>
                                    </Avatar>
                                    <span>{task.assignerName}</span>
                                </div>
                            )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                            <span>{format(new Date(task.dueDate), "PPP")}</span>
                            {isDeadlineApproaching(task.dueDate) && task.status !== 'Done' && (
                                <Tooltip>
                                <TooltipTrigger>
                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Deadline is approaching (less than 24 hours left).</p>
                                </TooltipContent>
                                </Tooltip>
                            )}
                            </div>
                        </TableCell>
                    </TableRow>
                )
            })}
            </TableBody>
        </Table>
        </TooltipProvider>
    );
  }

  return (
    <Tabs defaultValue="all" value={currentFilter}>
      <TabsContent value={currentFilter}>
        <Card className="glass">
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>
              Manage and track all relevant tasks for you and your team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderTable(filteredAndEnrichedTasks, filteredAndEnrichedTasks === null)}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
