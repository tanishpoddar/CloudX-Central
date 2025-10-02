
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, User, Users } from 'lucide-react';
import Link from 'next/link';

export default function AddTaskDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Task
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Choose Task Creation Type</DialogTitle>
          <DialogDescription>
            Select how you want to assign tasks.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
          <Button asChild variant="outline" className="h-20" onClick={() => setOpen(false)}>
            <Link href="/dashboard/tasks/create">
              <div className="flex flex-col items-center gap-2">
                <User className="h-6 w-6" />
                <span>Individual/Group Task</span>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20" onClick={() => setOpen(false)}>
            <Link href="/dashboard/tasks/create-bulk">
               <div className="flex flex-col items-center gap-2">
                <Users className="h-6 w-6" />
                <span>Bulk Individual Tasks</span>
              </div>
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
