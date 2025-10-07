"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ChevronsUpDown, Trash, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, setHours, setMinutes } from "date-fns";
import type { User, Team, UserRole, Task } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { addTask, updateTask, addBulkIndividualTasks } from "./actions";
import { useRouter } from "next/navigation";
import { useState, useMemo } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assignedToIds: z.array(z.string()).min(1, "Please assign the task to at least one user"),
  dueDate: z.date({ required_error: "A due date is required." }),
  dueDateTime: z.object({
      hour: z.string(),
      minute: z.string(),
      ampm: z.string(),
  }),
  links: z.array(z.object({ value: z.string().url("Must be a valid URL if not empty").or(z.literal('')) })).optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
    formType: 'create' | 'edit' | 'create-bulk';
    task?: Task;
    currentUser: User;
    allUsers: User[];
}

export default function TaskForm({ formType, task, currentUser, allUsers }: TaskFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
    const [openAssignee, setOpenAssignee] = useState(false);

    const { toast } = useToast();
    const router = useRouter();
    
    const defaultDueDate = task ? parseISO(task.dueDate) : new Date();
    
    const getInitialTime = () => {
        const date = task ? parseISO(task.dueDate) : new Date();
        const hour24 = date.getHours();
        const minute = date.getMinutes();
        
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        let hour12 = hour24 % 12;
        if (hour12 === 0) hour12 = 12;

        return {
            hour: String(hour12),
            minute: String(minute).padStart(2,'0'),
            ampm: ampm
        }
    }


    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: task?.title || '',
            description: task?.description || '',
            assignedToIds: task?.assignedToIds || (currentUser.role === 'Member' ? [currentUser.id] : []),
            dueDate: defaultDueDate,
            dueDateTime: getInitialTime(),
            links: task?.links ? task.links.map(l => ({ value: l })) : [{value: ''}]
        }
    });
    
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "links"
    });

    const assignableUsers = useMemo(() => {
        if (!currentUser) return [];

        if (currentUser.role === 'Member' && formType !== 'create-bulk') {
            return allUsers.filter(u => u.id === currentUser.id);
        }

        let availableUsers: User[] = [];

        if (currentUser.role === 'Co-founder' || currentUser.role === 'Secretary') {
            availableUsers = allUsers.filter(u => u.team !== 'Presidium');
        } else if (currentUser.role === 'Chair of Directors') {
            availableUsers = allUsers.filter(u => u.team === currentUser.team && (u.role === 'Lead' || u.role === 'Member'));
        } else if (currentUser.role === 'Lead') {
            availableUsers = allUsers.filter(u => u.subTeam === currentUser.subTeam && u.role === 'Member');
        }

        if ((selectedTeams.length > 0 || selectedRoles.length > 0) && (currentUser.role === 'Co-founder' || currentUser.role === 'Secretary' || currentUser.role === 'Chair of Directors')) {
             return availableUsers.filter(user => {
                const teamMatch = selectedTeams.length === 0 || (user.team && selectedTeams.includes(user.team));
                const roleMatch = selectedRoles.length === 0 || selectedRoles.includes(user.role);
                return teamMatch && roleMatch;
            });
        }
        
        return availableUsers;
    }, [currentUser, allUsers, selectedTeams, selectedRoles, formType]);
    
    const handleTeamFilterChange = (team: Team) => {
        setSelectedTeams(prev => 
            prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
        );
    }

    const handleRoleFilterChange = (role: UserRole) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    }

  const onSubmit = async (data: TaskFormValues) => {
    setIsSubmitting(true);
    try {
      let hour24 = parseInt(data.dueDateTime.hour, 10);
      if (data.dueDateTime.ampm === 'PM' && hour24 !== 12) {
          hour24 += 12;
      }
      if (data.dueDateTime.ampm === 'AM' && hour24 === 12) {
          hour24 = 0;
      }
      const combinedDateTime = setMinutes(setHours(data.dueDate, hour24), parseInt(data.dueDateTime.minute, 10));
      
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      data.assignedToIds.forEach(id => formData.append('assignedToIds[]', id));
      formData.append('dueDate', combinedDateTime.toISOString());
      
      if (data.links) {
        data.links.forEach(link => {
            if(link.value) formData.append('links[]', link.value);
        });
      }

      if (formType === 'create') {
        await addTask(formData);
      } else if (formType === 'create-bulk') {
        await addBulkIndividualTasks(formData);
      } else if (task) {
        await updateTask(task.id, formData);
      }

    } catch (error) {
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
            // This is expected, do nothing.
            return;
        }

        const errorMessage = error instanceof Error ? error.message : `Failed to ${formType} task. Please try again.`;
        toast({
            variant: "destructive",
            title: "Error",
            description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  };


  const getCardTitle = () => {
      switch(formType) {
          case 'create': return 'Create New Task';
          case 'edit': return 'Edit Task';
          case 'create-bulk': return 'Create Bulk Individual Tasks';
      }
  }

  const getCardDescription = () => {
       switch(formType) {
          case 'create': return 'Fill out the details below to create a new task for one or more users.';
          case 'edit': return 'Update the details for this task.';
          case 'create-bulk': return 'Create the same task individually for multiple selected users.';
      }
  }
  const submitButtonText = formType === 'create' || formType === 'create-bulk' ? 'Create Tasks' : 'Save Changes';

  return (
     <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>{getCardTitle()}</CardTitle>
          <CardDescription>
            {getCardDescription()}
          </CardDescription>
        </CardHeader>
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                    <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Design new homepage" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Add a more detailed description..."
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="space-y-4">
                       <FormField
                            control={form.control}
                            name="assignedToIds"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Assign To</FormLabel>
                                <Popover open={openAssignee} onOpenChange={setOpenAssignee}>
                                    <PopoverTrigger asChild>
                                        <div
                                            role="combobox"
                                            aria-expanded={openAssignee}
                                            className={cn("flex min-h-10 w-full items-center gap-1 rounded-md border border-input p-2 text-left", currentUser?.role === 'Member' && formType !== 'create-bulk' && "cursor-not-allowed opacity-50")}
                                        >
                                            <div className="flex flex-wrap gap-1">
                                                {field.value.length === 0 && <span className="text-muted-foreground">Select users...</span>}
                                                {field.value.map(userId => {
                                                    const user = allUsers.find(u => u.id === userId);
                                                    return (
                                                        <Badge key={userId} variant="secondary" className="gap-1.5">
                                                            {user?.name}
                                                            {(currentUser?.role !== 'Member' || formType === 'create-bulk') && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        field.onChange(field.value.filter(id => id !== userId));
                                                                    }}
                                                                    className="rounded-full hover:bg-muted-foreground/20"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                         <Command>
                                            <CommandInput placeholder="Search users..." />
                                            <CommandList>
                                                <CommandEmpty>No users found.</CommandEmpty>
                                                <CommandGroup>
                                                    {assignableUsers.filter(u => !field.value.includes(u.id)).map((user) => (
                                                        <CommandItem
                                                            key={user.id}
                                                            onSelect={() => {
                                                                field.onChange([...field.value, user.id]);
                                                            }}
                                                        >
                                                          {user.name} <span className="ml-2 text-muted-foreground">({user.role === 'Chair of Directors' ? 'Director' : user.role})</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                         </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         {(currentUser.role === 'Co-founder' || currentUser.role === 'Secretary' || currentUser.role === 'Chair of Directors') && (
                            <div className="p-4 border rounded-lg space-y-4">
                               <FormLabel>Filter Assignees</FormLabel>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(currentUser.role === 'Co-founder' || currentUser.role === 'Secretary') && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">By Team</p>
                                            {(['Technology', 'Corporate', 'Creatives'] as Team[]).map(team => (
                                                <div key={team} className="flex items-center space-x-2">
                                                    <Checkbox id={`team-${team}`} checked={selectedTeams.includes(team)} onCheckedChange={() => handleTeamFilterChange(team)} />
                                                    <label htmlFor={`team-${team}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{team}</label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                     <div className="space-y-2">
                                        <p className="text-sm font-medium">By Role</p>
                                        {(['Lead', 'Member'] as UserRole[]).map(role => (
                                            <div key={role} className="flex items-center space-x-2">
                                                <Checkbox id={`role-${role}`} checked={selectedRoles.includes(role)} onCheckedChange={() => handleRoleFilterChange(role)} />
                                                <label htmlFor={`role-${role}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{role}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                         )}
                    </div>
                     <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Due Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant="outline"
                                    className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                             <FormDescription>
                                Tasks with deadlines under 30 hours will be marked as urgent automatically.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                            control={form.control}
                            name="dueDateTime"
                            render={() => (
                                <FormItem>
                                <FormLabel>Due Time</FormLabel>
                                <div className="flex gap-2">
                                    <FormField
                                        control={form.control}
                                        name="dueDateTime.hour"
                                        render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Hour" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="max-h-48">
                                                    {Array.from({length: 12}, (_, i) => String(i + 1)).map(hour => <SelectItem key={hour} value={hour}>{hour}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}/>
                                     <FormField
                                        control={form.control}
                                        name="dueDateTime.minute"
                                        render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Minute" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {['00', '15', '30', '45'].map(min => <SelectItem key={min} value={min}>{min}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}/>
                                    <FormField
                                        control={form.control}
                                        name="dueDateTime.ampm"
                                        render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="AM/PM" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {['AM', 'PM'].map(ampm => <SelectItem key={ampm} value={ampm}>{ampm}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}/>
                                </div>
                                 <FormMessage />
                                </FormItem>
                            )}
                            />
                    </div>
                    <div className="space-y-4">
                        <FormLabel>Reference Links</FormLabel>
                        {fields.map((field, index) => (
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
                                            {index > 0 && (
                                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                                    <Trash className="h-4 w-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}
                         <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ value: "" })}
                            >
                            Add Link
                        </Button>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting} className="ml-auto">
                        {isSubmitting ? 'Saving...' : submitButtonText}
                    </Button>
                </CardFooter>
            </form>
        </Form>
     </Card>
  );
}
