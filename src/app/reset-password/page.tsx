
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { resetPassword } from '../actions';
import { useTransition, useState, Suspense } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordComponent() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: ResetPasswordFormValues) => {
    setError(null);
    if (!token) {
        setError('No reset token found. Please request a new link.');
        return;
    }
    startTransition(async () => {
      const result = await resetPassword({ token, password: data.password });
      if (result?.error) {
        setError(result.error);
        toast({
          variant: 'destructive',
          title: 'Reset Failed',
          description: result.error,
        });
      }
    });
  };

  if (!token) {
      return (
          <Card className="w-full max-w-sm glass">
            <CardHeader>
                <CardTitle>Invalid Link</CardTitle>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>The password reset link is missing or invalid. Please request a new one.</AlertDescription>
                </Alert>
            </CardContent>
             <CardFooter>
                <Button asChild className="w-full">
                    <Link href="/forgot-password">Request a new link</Link>
                </Button>
            </CardFooter>
          </Card>
      )
  }

  return (
    <Card className="w-full max-w-sm glass">
      <CardHeader>
        <CardTitle className="text-2xl">Reset Your Password</CardTitle>
        <CardDescription>
          Enter your new password below.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
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
                            placeholder="••••••••"
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
                            placeholder="••••••••"
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
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Resetting...' : 'Set New Password'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}


export default function ResetPasswordPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8">
            <Suspense fallback={<div>Loading...</div>}>
                <ResetPasswordComponent />
            </Suspense>
        </main>
    )
}
