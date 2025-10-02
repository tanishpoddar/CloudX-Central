'use client';

import { useState } from 'react';
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';
import Link from 'next/link';

export default function MyWeekClient({ tasks }: { tasks: Task[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekStartsOn = 1; // Monday

  const startDate = startOfWeek(currentDate, { weekStartsOn });

  const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  const tasksByDay = days.map(day => ({
    day,
    tasks: tasks.filter(task => isSameDay(new Date(task.dueDate), day)),
  }));

  const goToPreviousWeek = () => {
    setCurrentDate(addDays(currentDate, -7));
  };

  const goToNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };

  const statusBadgeVariant = {
    'To Do': 'outline',
    'In Progress': 'secondary',
    Done: 'default',
    Cancelled: 'destructive',
  } as const;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Week of {format(startDate, 'MMMM do')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-7">
          {tasksByDay.map(({ day, tasks }) => (
            <div
              key={day.toISOString()}
              className={cn(
                'rounded-lg border p-4',
                isSameDay(day, new Date()) && 'bg-muted/50'
              )}
            >
              <h3
                className={cn(
                  'font-semibold',
                  isSameDay(day, new Date()) && 'text-primary'
                )}
              >
                {format(day, 'EEE')}
              </h3>
              <p className="text-sm text-muted-foreground">{format(day, 'd')}</p>
              <div className="mt-4 space-y-2">
                {tasks.map(task => (
                  <Link href={`/dashboard/tasks/${task.id}`} key={task.id}>
                    <div className="rounded-lg border bg-background p-2 text-sm transition-shadow hover:shadow-md">
                      <p className="flex items-center gap-2 font-medium">
                        {task.urgent && <Flame className="h-4 w-4 text-destructive" />}
                        {task.title}
                      </p>
                      <Badge variant={statusBadgeVariant[task.status]} className="mt-1">
                        {task.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
                {tasks.length === 0 && (
                  <div className="h-10"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
