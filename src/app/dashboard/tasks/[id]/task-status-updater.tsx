"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Task, TaskStatus } from "@/types";
import { updateTaskStatus } from "../actions";
import { useToast } from "@/hooks/use-toast";

const availableStatuses: TaskStatus[] = ["To Do", "In Progress", "Done", "Cancelled"];

export default function TaskStatusUpdater({ task }: { task: Task }) {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(task.status);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleStatusChange = (newStatus: TaskStatus) => {
    setSelectedStatus(newStatus);
  };

  const handleUpdate = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("taskId", task.id);
        formData.append("status", selectedStatus);
        
        await updateTaskStatus(formData);
        
        toast({
          title: "Status Updated",
          description: `Task status has been changed to "${selectedStatus}".`,
        });

      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update status.",
        });
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Select onValueChange={handleStatusChange} defaultValue={selectedStatus}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Change status" />
        </SelectTrigger>
        <SelectContent>
          {availableStatuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleUpdate} disabled={isPending || selectedStatus === task.status}>
        {isPending ? "Updating..." : "Update Status"}
      </Button>
    </div>
  );
}
