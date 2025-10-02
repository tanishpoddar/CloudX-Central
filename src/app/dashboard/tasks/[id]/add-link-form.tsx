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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addLink } from "../actions";
import { useTransition } from "react";

const linkSchema = z.object({
  link: z.string().url("Please enter a valid URL."),
});

type LinkFormValues = z.infer<typeof linkSchema>;

export default function AddLinkForm({ taskId }: { taskId: string }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const form = useForm<LinkFormValues>({
        resolver: zodResolver(linkSchema),
        defaultValues: {
            link: '',
        }
    });

  const onSubmit = async (data: LinkFormValues) => {
    startTransition(async () => {
        try {
            const formData = new FormData();
            formData.append('taskId', taskId);
            formData.append('link', data.link);
        
            await addLink(formData);
            
            toast({
                title: "Link Added",
                description: "The reference link has been added to the task.",
            });
            form.reset();

        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to add link.",
            });
        }
    });
  };

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
            <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                    <FormItem className="flex-1">
                        <FormControl>
                            <Input placeholder="https://example.com" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <Button type="submit" disabled={isPending}>
                {isPending ? 'Adding...' : 'Add'}
            </Button>
        </form>
    </Form>
  );
}
