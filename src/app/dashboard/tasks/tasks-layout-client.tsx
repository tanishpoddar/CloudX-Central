

'use client';

import {
  File,
  LayoutGrid,
  Rows,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import AddTaskDialog from './add-task-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


interface EnrichedTask {
  id: string;
  title: string;
  status: string;
  dueDate: string;
  assignees: string[];
  assigner: string;
}

const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'missing', label: 'Missing' },
    { value: 'done', label: 'Done' },
];

export default function TasksLayoutClient({ 
    canCreateTask, 
    children, 
    tasks 
}: { 
    canCreateTask: boolean, 
    children: React.ReactNode, 
    tasks: EnrichedTask[] 
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const isBoardView = pathname.includes('/board');
  const isCreateView = pathname.includes('/create');
  
  const currentFilter = searchParams.get('filter') || 'all';

  const handleExport = () => {
    const headers = ['Task ID', 'Title', 'Status', 'Due Date', 'Assignees', 'Assigner'];
    const rows = tasks.map(task => [
        `"${task.id}"`,
        `"${task.title.replace(/"/g, '""')}"`,
        `"${task.status}"`,
        `"${new Date(task.dueDate).toISOString()}"`,
        `"${task.assignees.join(', ')}"`,
        `"${task.assigner.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + rows.join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cloudx_tasks_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  const handleFilterChange = (value: string) => {
    const newPath = `/dashboard/tasks?filter=${value}`;
    router.push(newPath);
  }

  const tabValue = pathname.endsWith('/tasks') ? currentFilter : undefined;


  return (
    <>
      <div className="flex items-center gap-4">
        {!isBoardView && !isCreateView && (
            <>
                <div className="hidden md:block">
                    <Tabs value={tabValue} onValueChange={handleFilterChange}>
                        <TabsList>
                            {filterOptions.map(opt => (
                                <TabsTrigger key={opt.value} value={opt.value}>{opt.label}</TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
                <div className="md:hidden">
                    <Select value={currentFilter} onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Filter tasks" />
                        </SelectTrigger>
                        <SelectContent>
                             {filterOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant={!isBoardView ? 'secondary' : 'outline'} className="h-8 gap-1" asChild>
            <Link href="/dashboard/tasks">
              <Rows className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                List
              </span>
            </Link>
          </Button>
          <Button size="sm" variant={isBoardView ? 'secondary' : 'outline'} className="h-8 gap-1" asChild>
            <Link href="/dashboard/tasks/board">
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Board
              </span>
            </Link>
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleExport}>
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          {canCreateTask && <AddTaskDialog />}
        </div>
      </div>
      {children}
    </>
  );
}
