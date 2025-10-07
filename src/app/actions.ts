'use server';

import { login as authLogin, logout as authLogout } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';


const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().default(false).optional(),
});

export async function login(data: unknown) {
  const validatedFields = loginSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      error: 'Invalid fields!',
    };
  }

  const { email, password, remember } = validatedFields.data;

  try {
    await authLogin(email, password, remember);
  } catch (error) {
    if (error instanceof Error) {
      return {
        error: error.message,
      };
    }
    return {
      error: 'An unknown error occurred.',
    };
  }
  
  redirect('/dashboard');
}


export async function logout() {
  await authLogout();
  redirect('/');
}
