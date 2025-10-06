
'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addAnnouncementComment } from "../actions";
import { useTransition } from "react";
import type { User, AnnouncementComment } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';

const commentSchema = z.object({
  message: z.string().min(1, "Comment cannot be empty."),
});
type CommentFormValues = z.infer<typeof commentSchema>;

interface CommentSectionProps {
    announcementId: string;
    comments: AnnouncementComment[];
    currentUser: User;
    userMap: Map<string, User>;
}

export function CommentSection({ announcementId, comments, currentUser, userMap }: CommentSectionProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const form = useForm<CommentFormValues>({
        resolver: zodResolver(commentSchema),
        defaultValues: { message: '' }
    });

  const onSubmit = async (data: CommentFormValues) => {
    startTransition(async () => {
        try {
            const formData = new FormData();
            formData.append('announcementId', announcementId);
            formData.append('message', data.message);
        
            await addAnnouncementComment(formData);
            form.reset();

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to add comment.",
            });
        }
    });
  };

  return (
    <div className="w-full space-y-4">
        {comments.length > 0 && (
            <div className="space-y-4">
                {comments.map(comment => {
                    const author = userMap.get(comment.userId);
                    return (
                        <div key={comment.id} className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={author?.avatar ?? undefined} />
                                <AvatarFallback>{author?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 rounded-lg bg-muted/50 p-3">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-sm">{author?.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                                <p className="text-sm text-muted-foreground">{comment.message}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        )}

        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={currentUser.avatar ?? undefined} />
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormControl>
                                <Textarea placeholder="Write a reply..." {...field} disabled={isPending} className="min-h-[40px]" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Replying...' : 'Reply'}
                </Button>
            </form>
        </Form>
    </div>
  );
}
