
'use server';

import { login as authLogin, logout as authLogout } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
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

  if (!adminDb) {
    return { error: 'The database is not available. Please try again later.' };
  }

  const usersRef = adminDb.collection("users");
  const q = usersRef.where("email", "==", email);
  const querySnapshot = await q.get();

  if (querySnapshot.empty) {
    // We don't want to reveal if an email exists or not for security reasons
    return { success: 'If an account exists for this email, a reset link has been sent.' };
  }
  
  const user = querySnapshot.docs[0].data();
  const userId = querySnapshot.docs[0].id;

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 hour from now

  await adminDb.collection('passwordResetTokens').doc(userId).set({
    token,
    expires,
    userId,
  }, { merge: true });

  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `CloudX Central <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset Your CloudX Central Password',
      html: `
        <p>Hello ${user.name},</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in one hour.</p>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
      `,
    });

    return { success: 'If an account exists for this email, a reset link has been sent.' };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return { error: 'Could not send reset email. Please contact an administrator.' };
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

  if (!adminDb) {
    return { error: 'The database is not available. Please try again later.' };
  }

  const tokensRef = adminDb.collection('passwordResetTokens');
  const q = tokensRef.where('token', '==', token).where('expires', '>', new Date());
  const tokenSnapshot = await q.get();

  if (tokenSnapshot.empty) {
    return { error: 'This reset token is invalid or has expired.' };
  }

  const tokenDoc = tokenSnapshot.docs[0];
  const userId = tokenDoc.data().userId;

  await adminDb.collection('users').doc(userId).update({
    password: password, // In a real app, this should be securely hashed!
  });

  await tokenDoc.ref.delete();

  redirect('/login');
}
