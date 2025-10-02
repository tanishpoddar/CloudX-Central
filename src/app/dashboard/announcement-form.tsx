
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createAnnouncement } from './actions';
import { useTransition, useState } from 'react';
import { PlusCircle, Trash } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import type { User, Team } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';


const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  links: z.array(z.object({ value: z.string().url("Must be a valid URL if not empty").or(z.literal('')) })).optional(),
  isPoll: z.boolean().default(false),
  pollQuestion: z.string().optional(),
  pollOptions: z.array(z.object({ text: z.string() })).optional(),
  postToMyDomain: z.boolean().default(false).optional(),
  targetDomains: z.array(z.string()).optional(),
}).refine(data => {
    if (data.isPoll) {
        return !!data.pollQuestion && data.pollQuestion.length > 0;
    }
    return true;
}, {
    message: "Poll question is required when creating a poll.",
    path: ["pollQuestion"],
}).refine(data => {
    if (data.isPoll) {
        return !!data.pollOptions && data.pollOptions.length >= 2 && data.pollOptions.every(opt => opt.text.length > 0);
    }
    return true;
}, {
    message: "A poll must have at least two non-empty options.",
    path: ["pollOptions"],
});


type AnnouncementFormValues = z.infer<typeof announcementSchema>;

interface AnnouncementFormProps {
    currentUser: User;
}

const teams: Team[] = ['Technology', 'Corporate', 'Creatives'];

export default function AnnouncementForm({ currentUser }: AnnouncementFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const form = useForm<AnnouncementFormValues>({
        resolver: zodResolver(announcementSchema),
        defaultValues: { 
            title: '', 
            content: '',
            links: [{ value: '' }],
            isPoll: false,
            pollQuestion: '',
            pollOptions: [{ text: '' }, { text: '' }],
            postToMyDomain: false,
            targetDomains: [],
        }
    });

    const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({
        control: form.control, name: "links"
    });

    const { fields: pollOptionFields, append: appendPollOption, remove: removePollOption } = useFieldArray({
        control: form.control, name: "pollOptions"
    });

    const isPoll = form.watch('isPoll');
    const isPresidium = currentUser.role === 'Co-founder' || currentUser.role === 'Secretary';
    const isDirector = currentUser.role === 'Chair of Directors';

  const onSubmit = async (data: AnnouncementFormValues) => {
    startTransition(async () => {
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('content', data.content);
            if (data.links) {
                data.links.forEach(link => {
                    if (link.value) formData.append('links[]', link.value);
                });
            }
            if (data.isPoll) {
                formData.append('isPoll', 'true');
                formData.append('pollQuestion', data.pollQuestion || '');
                if (data.pollOptions) {
                    data.pollOptions.forEach(opt => formData.append('pollOptions[]', opt.text));
                }
            } else {
                 formData.append('isPoll', 'false');
            }

            if (isDirector && data.postToMyDomain && currentUser.team) {
                formData.append('targetDomains[]', currentUser.team);
            } else if (isPresidium && data.targetDomains && data.targetDomains.length > 0) {
                data.targetDomains.forEach(domain => formData.append('targetDomains[]', domain));
            }
            
            await createAnnouncement(formData);

        } catch (error) {
            if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
                // This is expected after successful creation
                return;
            }
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to post announcement.',
            });
        }
    });
  };

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Q3 All-Hands Meeting" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Write your announcement here..." {...field} rows={5} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {isDirector && currentUser.team && (
                 <FormField
                    control={form.control}
                    name="postToMyDomain"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Post only to my team ({currentUser.team})</FormLabel>
                                <FormDescription>
                                    If checked, this announcement will only be visible to members of your team.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
            )}

            {isPresidium && (
                <FormField
                    control={form.control}
                    name="targetDomains"
                    render={() => (
                        <FormItem className="space-y-4 p-4 border rounded-lg">
                             <div className="mb-4">
                                <FormLabel className="text-base">Target Audience</FormLabel>
                                <FormDescription>
                                    Select which team(s) should see this announcement. If none are selected, it will be visible to the entire organization.
                                </FormDescription>
                            </div>
                            {teams.map((team) => (
                                <FormField
                                key={team}
                                control={form.control}
                                name="targetDomains"
                                render={({ field }) => {
                                    return (
                                    <FormItem
                                        key={team}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                        <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(team)}
                                            onCheckedChange={(checked) => {
                                            return checked
                                                ? field.onChange([...(field.value || []), team])
                                                : field.onChange(
                                                    field.value?.filter(
                                                        (value) => value !== team
                                                    )
                                                    )
                                            }}
                                        />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            {team} Team
                                        </FormLabel>
                                    </FormItem>
                                    )
                                }}
                                />
                            ))}
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}

            <div className="space-y-4">
                <FormLabel>Reference Links</FormLabel>
                {linkFields.map((field, index) => (
                     <FormField
                        key={field.id}
                        control={form.control}
                        name={`links.${index}.value`}
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center gap-2">
                                    <FormControl>
                                        <Input {...field} placeholder="https://example.com" />
                                    </FormControl>
                                    
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(index)} disabled={linkFields.length <= 1}>
                                        <Trash className="h-4 w-4 text-destructive" />
                                    </Button>
                                    
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendLink({ value: "" })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Link
                </Button>
            </div>
            
            <FormField
                control={form.control}
                name="isPoll"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>Include a Poll</FormLabel>
                            <FormMessage />
                        </div>
                        <FormControl>
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />

            {isPoll && (
                <div className="space-y-4 p-4 border rounded-lg">
                     <FormField
                        control={form.control}
                        name="pollQuestion"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Poll Question</FormLabel>
                                <FormControl>
                                    <Input placeholder="What should we focus on next quarter?" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="space-y-2">
                        <FormLabel>Poll Options</FormLabel>
                        {pollOptionFields.map((field, index) => (
                            <FormField
                                key={field.id}
                                control={form.control}
                                name={`pollOptions.${index}.text`}
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center gap-2">
                                            <FormControl>
                                                <Input {...field} placeholder={`Option ${index + 1}`} />
                                            </FormControl>
                                            {pollOptionFields.length > 2 && (
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removePollOption(index)}>
                                                    <Trash className="h-4 w-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendPollOption({ text: "" })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Option
                    </Button>
                </div>
            )}


            <div className="flex justify-end gap-4">
                <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isPending}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Posting...' : 'Post Announcement'}
                </Button>
            </div>
        </form>
    </Form>
  );
}
