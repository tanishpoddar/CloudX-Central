'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase-admin';
import { getCurrentUser } from '@/lib/auth';

const profileSchema = z
  .object({
    username: z.string().min(1, 'Username is required.'),
    password: z.string().optional(),
    avatar: z.string().url('Must be a valid URL.').or(z.literal('')),
    phone: z.string().min(1, 'Phone number is required.'),
    birthday: z.string().min(1, 'Birthday is required.'),
    linkedin: z.string().url('Must be a valid URL.').or(z.literal('')),
    github: z.string().url('Must be a valid URL.').or(z.literal('')),
  });

export async function updateMyProfile(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be logged in to update your profile.');
  }

  const rawData = Object.fromEntries(formData.entries());

  // Don't validate password here as it's optional and has confirmPassword
  const validatedFields = profileSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error('Validation Errors:', validatedFields.error.flatten().fieldErrors);
    throw new Error('Invalid profile data provided.');
  }
  
  const dataToUpdate: Record<string, any> = {
      ...validatedFields.data,
      avatar: validatedFields.data.avatar || null,
      linkedin: validatedFields.data.linkedin || null,
      github: validatedFields.data.github || null,
  };

  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (password) {
      if (password.length < 6) throw new Error("Password must be at least 6 characters long.");
      if (password !== confirmPassword) throw new Error("Passwords don't match.");
      // In a real app, hash the password before saving!
      dataToUpdate.password = password;
  }

  try {
    if (!adminDb) {
      throw new Error("Database not initialized.");
    }
    await adminDb.collection('users').doc(currentUser.id).update(dataToUpdate);
  } catch (error) {
    console.error("Failed to update profile:", error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error("An unknown error occurred while updating the profile.");
  }

  revalidatePath(`/dashboard/users/${currentUser.id}`);
  revalidatePath(`/dashboard/my-profile/edit`);
}