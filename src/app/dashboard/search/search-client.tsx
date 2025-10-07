
'use client';

import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { User, Task, Announcement } from '@/types';
import { format } from 'date-fns';

type EnrichedTask = Task & { assignerName?: string; };
type EnrichedAnnouncement = Announcement & { authorName?: string; };

export default function SearchClient({
  users,
  tasks,
  announcements,
  allUsers,
}: {
  users: User[];
  tasks: Task[];
  announcements: Announcement[];
  allUsers: User[];
}) {
  const userMap = new Map(allUsers.map(u => [u.id, u]));

  const enrichedTasks = tasks.map(task => ({
      ...task,
      assignerName: userMap.get(task.assignedById)?.name || 'System'
  }));

  const enrichedAnnouncements = announcements.map(announcement => ({
      ...announcement,
      authorName: userMap.get(announcement.authorId)?.name || 'System'
  }));

  const statusBadgeVariant = {
    'To Do': 'outline',
    'In Progress': 'secondary',
    Done: 'default',
    Cancelled: 'destructive',
  } as const;

  return (
    <Accordion type="multiple" defaultValue={['users', 'tasks', 'announcements']} className="w-full space-y-4">
      <AccordionItem value="users" className="glass rounded-lg border px-4">
        <AccordionTrigger className="text-lg font-medium hover:no-underline">
            Users ({users.length})
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-4">
            {users.length > 0 ? (
                users.map(user => (
                    <Link href={`/dashboard/users/${user.id}`} key={user.id} className="flex items-center gap-4 rounded-md p-2 hover:bg-muted/50">
                        <Avatar>
                            <AvatarImage src={user.avatar ?? undefined} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </Link>
                ))
            ) : <p className="text-muted-foreground text-center py-4">No users found.</p>}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="tasks" className="glass rounded-lg border px-4">
        <AccordionTrigger className="text-lg font-medium hover:no-underline">
            Tasks ({tasks.length})
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-4">
            {enrichedTasks.length > 0 ? (
                enrichedTasks.map(task => (
                    <Link href={`/dashboard/tasks/${task.id}`} key={task.id} className="block rounded-md p-3 hover:bg-muted/50">
                        <div className="flex justify-between">
                            <p className="font-semibold">{task.title}</p>
                            <Badge variant={statusBadgeVariant[task.status]}>{task.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">Due: {format(new Date(task.dueDate), 'PPP')}</p>
                    </Link>
                ))
            ) : <p className="text-muted-foreground text-center py-4">No tasks found.</p>}
          </div>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="announcements" className="glass rounded-lg border px-4">
        <AccordionTrigger className="text-lg font-medium hover:no-underline">
            Announcements ({announcements.length})
        </AccordionTrigger>
        <AccordionContent>
           <div className="space-y-4 pt-4">
                {enrichedAnnouncements.length > 0 ? (
                    enrichedAnnouncements.map(announcement => (
                        <Link href={`/dashboard/announcements#${announcement.id}`} key={announcement.id} className="block rounded-md p-3 hover:bg-muted/50">
                            <p className="font-semibold">{announcement.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">By {announcement.authorName} on {format(new Date(announcement.createdAt), 'PPP')}</p>
                        </Link>
                    ))
                ) : <p className="text-muted-foreground text-center py-4">No announcements found.</p>}
            </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
