"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateTaskStatus } from "./actions";

interface MarkAsDoneButtonProps {
  taskId: string;
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "default" | "lg";
}

export default function MarkAsDoneButton({ taskId, variant = "default", size="sm" }: MarkAsDoneButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleMarkAsDone = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("taskId", taskId);
        formData.append("status", "Done");
        await updateTaskStatus(formData);

        toast({
          title: "Task Completed",
          description: "The task has been marked as done.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to update task.",
        });
      }
    });
  };

  return (
    <Button onClick={handleMarkAsDone} disabled={isPending} variant={variant} size={size}>
        <CheckCircle2 className="mr-2 h-4 w-4" />
        {isPending ? "Updating..." : "Mark as Done"}
    </Button>
  );
}
