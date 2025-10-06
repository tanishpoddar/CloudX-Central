
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addComment } from "../actions";
import { useTransition } from "react";
import type { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const commentSchema = z.object({
  comment: z.string().min(1, "Comment cannot be empty."),
});

type CommentFormValues = z.infer<typeof commentSchema>;

export default function AddCommentForm({ taskId, currentUser }: { taskId: string, currentUser: User }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const form = useForm<CommentFormValues>({
        resolver: zodResolver(commentSchema),
        defaultValues: {
            comment: '',
        }
    });

  const onSubmit = async (data: CommentFormValues) => {
    startTransition(async () => {
        try {
            const formData = new FormData();
            formData.append('taskId', taskId);
            formData.append('comment', data.comment);
        
            await addComment(formData);
            
            toast({
                title: "Comment Added",
                description: "Your comment has been posted.",
            });
            form.reset();

        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to add comment.",
            });
        }
    });
  };

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={currentUser.avatar ?? undefined} />
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormControl>
                                <Textarea placeholder="Write a comment..." {...field} disabled={isPending} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Posting...' : 'Post Comment'}
                </Button>
            </div>
        </form>
    </Form>
  );
}
