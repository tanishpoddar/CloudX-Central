"use client";

import { useMemo, useState, useEffect } from "react";
import { Gantt, ViewMode, Task } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { Skeleton } from "@/components/ui/skeleton";

interface MyTask {
  id: string;
  title: string;
  createdAt: string | Date;
  dueDate: string | Date;
  status: 'Done' | 'In Progress' | string;
}

export default function GanttChartClient({ tasks }: { tasks: MyTask[] }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const ganttData: Task[] = useMemo(() => {
    return tasks.map((task) => ({
      start: new Date(task.createdAt),
      end: new Date(task.dueDate),
      name: task.title,
      id: task.id,
      type: "task",
      progress: task.status === 'Done' ? 100 : task.status === 'In Progress' ? 50 : 0,
      styles: { progressColor: '#2E2BF5', progressSelectedColor: '#FB1587' }
    }));
  }, [tasks]);

  if (ganttData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        No tasks to display in the Gantt chart.
      </div>
    );
  }
  
  if (!isClient) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  return (
    <div className="gantt-chart-container p-4 glass rounded-lg w-full">
      <Gantt
        tasks={ganttData}
        viewMode={ViewMode.Day}
        listCellWidth="150px"
        ganttHeight={500}
        columnWidth={65}
      />
    </div>
  );
}