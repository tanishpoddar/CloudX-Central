"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { addSubtask, toggleSubtask, updateSubtaskOrder } from "../actions";
import type { Subtask } from "@/types";
import { GripVertical, Trash } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

const subtaskSchema = z.object({
  title: z.string().min(1, "Subtask title cannot be empty."),
});
type SubtaskFormValues = z.infer<typeof subtaskSchema>;

export default function SubtasksManager({
  taskId,
  initialSubtasks,
}: {
  taskId: string;
  initialSubtasks: Subtask[];
}) {
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialSubtasks);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<SubtaskFormValues>({
    resolver: zodResolver(subtaskSchema),
    defaultValues: { title: "" },
  });

  const completedCount = subtasks.filter(st => st.isCompleted).length;
  const progress =
    subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  const handleAddSubtask = async (data: SubtaskFormValues) => {
    startTransition(async () => {
      try {
        const newSubtask = await addSubtask(taskId, data.title);
        if (newSubtask) {
          setSubtasks(prev => [...prev, newSubtask]);
          form.reset();
        } else {
          throw new Error("Failed to create subtask.");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to add subtask.",
        });
      }
    });
  };

  const handleToggleSubtask = (subtaskId: string, isCompleted: boolean) => {
    setSubtasks(prev =>
      prev.map(st =>
        st.id === subtaskId ? { ...st, isCompleted: !isCompleted } : st
      )
    );

    startTransition(async () => {
      try {
        await toggleSubtask(subtaskId, !isCompleted);
      } catch (error) {
        setSubtasks(prev =>
          prev.map(st =>
            st.id === subtaskId ? { ...st, isCompleted: isCompleted } : st
          )
        );
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update subtask status.",
        });
      }
    });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(subtasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const updatedSubtasks = items.map((item, index) => ({ ...item, order: index }));

    setSubtasks(updatedSubtasks);

    const subtaskOrder = updatedSubtasks.map(st => st.id);
    startTransition(async () => {
        try {
            await updateSubtaskOrder(taskId, subtaskOrder);
        } catch (error) {
            setSubtasks(initialSubtasks); // revert on error
             toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to reorder subtasks.",
            });
        }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Progress value={progress} className="w-full" />
        <span className="text-sm text-muted-foreground">
          {completedCount}/{subtasks.length}
        </span>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="subtasks">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {subtasks.sort((a,b) => a.order - b.order).map((subtask, index) => (
                 <Draggable key={subtask.id} draggableId={subtask.id} index={index}>
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex items-center gap-2 rounded-md bg-muted/50 p-2"
                        >
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                            <Checkbox
                                id={subtask.id}
                                checked={subtask.isCompleted}
                                onCheckedChange={() => handleToggleSubtask(subtask.id, subtask.isCompleted)}
                            />
                            <label
                                htmlFor={subtask.id}
                                className={`flex-1 text-sm ${subtask.isCompleted ? "text-muted-foreground line-through" : ""}`}
                            >
                                {subtask.title}
                            </label>
                        </div>
                    )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <form
        onSubmit={form.handleSubmit(handleAddSubtask)}
        className="flex items-center gap-2"
      >
        <Input
          {...form.register("title")}
          placeholder="Add a new sub-task..."
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending}>
          Add
        </Button>
      </form>
       {form.formState.errors.title && (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        )}
    </div>
  );
}
