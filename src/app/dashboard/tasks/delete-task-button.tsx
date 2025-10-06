
"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash } from "lucide-react";
import { deleteTask } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


interface DeleteTaskButtonProps {
  taskId: string;
}

export default function DeleteTaskButton({ taskId }: DeleteTaskButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteTask(taskId);
        toast({
          title: "Task Deleted",
          description: "The task has been permanently removed.",
        });
        router.push('/dashboard/tasks');
      } catch (error) {
         if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
            // This is expected, do nothing.
            return;
        }
        toast({
          variant: "destructive",
          title: "Deletion Failed",
          description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" type="button">
            <Trash className="mr-2 h-4 w-4" />
            Delete Task
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the task
                and all associated logs, comments, and subtasks.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Continue"}
            </AlertDialogAction>
            </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
