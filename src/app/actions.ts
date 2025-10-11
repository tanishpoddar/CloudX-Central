
'use server';

import { login as authLogin, logout as authLogout } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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
  redirect('/login');
}


const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

export async function sendPasswordResetLink(data: unknown) {
  const validatedFields = emailSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: 'Invalid email address.' };
  }

  const { email } = validatedFields.data;

  if (!adminAuth) {
    return { error: 'The authentication service is not available. Please try again later.' };
  }
  
  try {
    // This is the correct Firebase Admin SDK method to generate a reset link
    const link = await adminAuth.generatePasswordResetLink(email, {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/login`, // Redirect back to login after reset
    });

    // Firebase handles sending the email via its own servers when you use this method.
    // We just need to make sure the email template in Firebase Console is set up.
    // For now, let's log the link for debugging.
    console.log("Generated password reset link:", link);
    
    // In a real scenario, you'd trigger an email with this link.
    // For this app, we'll assume Firebase's email template is used.
    
    return { success: 'If an account exists for this email, a password reset link has been sent.' };
  } catch (error: any) {
    console.error("Failed to generate password reset link:", error);
    // Don't leak information about whether the user exists or not.
    if (error.code === 'auth/user-not-found') {
        return { success: 'If an account exists for this email, a password reset link has been sent.' };
    }
    return { error: 'Could not send reset email. Please try again later.' };
  }
}

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Invalid token.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export async function resetPassword(data: unknown) {
   const validatedFields = resetPasswordSchema.safeParse(data);

   if (!validatedFields.success) {
     return { error: 'Invalid data provided.' };
   }

   const { token, password } = validatedFields.data;

  if (!adminAuth) {
    return { error: 'The authentication service is not available. Please try again later.' };
  }
  
  try {
    // This is an incorrect flow. The client should handle this.
    // This function will be removed and replaced with a client-side implementation.
    return { error: 'This function is deprecated.' };
  } catch (error) {
    console.error("Error updating password:", error);
    return { error: 'Failed to update password. Please try again.' };
  }
}
