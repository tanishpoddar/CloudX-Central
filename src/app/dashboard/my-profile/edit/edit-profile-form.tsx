
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { updateMyProfile } from './actions';
import type { User } from '@/types';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const profileSchema = z
  .object({
    username: z.string().min(1, 'Username is required.'),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    avatar: z.string().url('Must be a valid URL.').or(z.literal('')),
    phone: z.string().min(1, 'Phone number is required.'),
    birthday: z.string().min(1, 'Birthday is required.'),
    linkedin: z.string().url('Must be a valid URL.').or(z.literal('')),
    github: z.string().url('Must be a valid URL.').or(z.literal('')),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine(
    data => {
      if (data.password) {
        return data.password.length >= 6;
      }
      return true;
    },
    {
      message: 'Password must be at least 6 characters long.',
      path: ['password'],
    }
  );

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EditProfileForm({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user.username || '',
      password: '',
      confirmPassword: '',
      avatar: user.avatar || '',
      phone: user.phone || '',
      birthday: user.birthday || '',
      linkedin: user.linkedin || '',
      github: user.github || '',
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // Don't append password fields if they are empty
            if (key.includes('Password') && !value) return;
            formData.append(key, value);
          }
        });

        await updateMyProfile(formData);

        toast({
          title: 'Profile Updated',
          description: 'Your changes have been saved successfully.',
        });
        router.push(`/dashboard/users/${user.id}`);
        router.refresh(); // Refresh to ensure new data is shown
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Uneditable Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem>
              <FormLabel>Name</FormLabel>
              <Input value={user.name} disabled className="bg-muted/50" />
            </FormItem>
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input value={user.email} disabled className="bg-muted/50" />
            </FormItem>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem>
              <FormLabel>Team</FormLabel>
              <Input value={user.team || 'N/A'} disabled className="bg-muted/50" />
            </FormItem>
            <FormItem>
              <FormLabel>Sub-Team</FormLabel>
              <Input value={user.subTeam || 'N/A'} disabled className="bg-muted/50" />
            </FormItem>
        </div>


        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Your username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
            <p className="text-sm font-medium">Change Password</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <div className="relative">
                        <FormControl>
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Leave blank to keep current"
                            {...field}
                            disabled={isPending}
                            className="pr-10"
                        />
                        </FormControl>
                        <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                        disabled={isPending}
                        >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                     <div className="relative">
                        <FormControl>
                        <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm your new password"
                            {...field}
                            disabled={isPending}
                            className="pr-10"
                        />
                        </FormControl>
                        <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                        disabled={isPending}
                        >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
        </div>

        <FormField
          control={form.control}
          name="avatar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://your-image-url.com/avatar.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                        <Input placeholder="+1-123-456-7890" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="birthday"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Birthday</FormLabel>
                    <FormControl>
                        <Input type="date" placeholder="YYYY-MM-DD" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <FormField
          control={form.control}
          name="linkedin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LinkedIn Profile URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://www.linkedin.com/in/yourprofile" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="github"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GitHub Profile URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://github.com/yourusername" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
