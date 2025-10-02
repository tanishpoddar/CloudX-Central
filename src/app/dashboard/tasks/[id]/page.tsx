import { notFound, redirect } from 'next/navigation';
import {
  getTaskById,
  getAllUsers,
  getCommentsForTask,
  getSubtasksForTask,
} from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  CalendarIcon,
  Users,
  ClipboardList,
  Flame,
  Link as LinkIcon,
  MessageSquare,
  CheckSquare,
  Pencil,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Link from 'next/link';
import DeleteTaskButton from '../delete-task-button';
import TaskStatusUpdater from './task-status-updater';
import AddLinkForm from './add-link-form';
import AddCommentForm from './add-comment-form';
import SubtasksManager from './subtasks-manager';
import MarkAsDoneButton from '../mark-as-done-button';
import { Button } from '@/components/ui/button';
import SummarizeTaskDialog from './summarize-task-dialog';
import { deleteTask } from '../actions';

interface TaskDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TaskDetailsPage({ params }: TaskDetailsPageProps) {
  const resolvedParams = await params;
  const task = await getTaskById(resolvedParams.id);
  const users = await getAllUsers();
  const currentUser = await getCurrentUser();

  if (!task || !currentUser) {
    notFound();
  }

  const [comments, subtasks] = await Promise.all([
    getCommentsForTask(task.id),
    getSubtasksForTask(task.id),
  ]);

  const assignedToIds = task.assignedToIds || [];
  const assignees = users.filter(u => assignedToIds.includes(u.id));
  const assigner = users.find(u => u.id === task.assignedById);

  const isAssigner = currentUser.id === task.assignedById;
  const isAssignee = assignedToIds.includes(currentUser.id);
  const isPresidium = currentUser.role === 'Co-founder' || currentUser.role === 'Secretary';
  const canEdit = isPresidium || isAssigner;
  const canDelete = isAssigner || isPresidium;

  const statusBadgeVariant = {
    'To Do': 'outline',
    'In Progress': 'secondary',
    'Done': 'default',
    'Cancelled': 'destructive',
  } as const;

  const enrichedComments = comments.map(comment => {
    const user = users.find(u => u.id === comment.userId);
    return {
      ...comment,
      userName: user?.name || 'Unknown',
      userAvatar: user?.avatar,
    };
  });

  const handleDeleteTask = async () => {
    'use server';
    await deleteTask(task.id);
    redirect('/dashboard/tasks');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="font-headline text-3xl font-bold md:text-4xl">
              {task.title}
            </h1>
            {task.urgent && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Flame className="h-6 w-6 text-destructive" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This task is marked as urgent.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SummarizeTaskDialog taskId={task.id} />
            {isAssignee && task.status !== 'Done' && task.status !== 'Cancelled' && (
              <MarkAsDoneButton taskId={task.id} />
            )}
            {canEdit && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/tasks/${task.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Task
                </Link>
              </Button>
            )}
            {canDelete && (
              <form action={handleDeleteTask}>
                <DeleteTaskButton taskId={task.id} asIcon={false} />
              </form>
            )}
          </div>
        </div>
        <p className="text-muted-foreground">
          Created on {format(new Date(task.createdAt), 'PPP p')} by {assigner?.name || 'Unknown'}
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="space-y-8 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" /> Task Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{task.description || 'No description provided.'}</p>
            </CardContent>
          </Card>

          {isAssignee && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" /> Sub-tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SubtasksManager taskId={task.id} initialSubtasks={subtasks} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {enrichedComments.length > 0 ? (
                enrichedComments.map(comment => (
                  <div key={comment.id} className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={comment.userAvatar} />
                      <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{comment.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <p className="text-muted-foreground">{comment.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground">No comments yet.</p>
              )}
              <Separator />
              <AddCommentForm taskId={task.id} currentUser={currentUser} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <ClipboardList className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Status</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusBadgeVariant[task.status]}>{task.status}</Badge>
                  </div>
                </div>
              </div>
              {isAssignee && (
                <div className="space-y-2">
                  <Separator />
                  <TaskStatusUpdater task={task} />
                </div>
              )}
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Due Date</span>
                  <span className="text-sm">{format(new Date(task.dueDate), 'PPP p')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>People</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Assignees</span>
                  <div className="flex flex-col gap-1 mt-1">
                    {assignees.length > 0 ? (
                      assignees.map(assignee => (
                        <Link
                          key={assignee.id}
                          href={`/dashboard/users/${assignee.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {assignee.name}
                        </Link>
                      ))
                    ) : (
                      <span className="text-sm">Unassigned</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Assigner</span>
                  {assigner ? (
                    <Link
                      href={`/dashboard/users/${assigner.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {assigner.name}
                    </Link>
                  ) : (
                    <span className="text-sm">Unassigned</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reference Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <LinkIcon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div className="flex flex-col gap-2">
                  {task.links && task.links.length > 0 ? (
                    task.links.map(link => (
                      <Link
                        key={link}
                        href={link}
                        target="_blank"
                        className="text-sm text-primary hover:underline"
                      >
                        {link}
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No links attached.</p>
                  )}
                </div>
              </div>
              {isAssignee && (
                <div className="space-y-2 pt-4">
                  <Separator />
                  <p className="pt-4 text-sm font-medium">Add a link</p>
                  <AddLinkForm taskId={task.id} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}