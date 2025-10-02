'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase-admin';
import { getCurrentUser } from '@/lib/auth';
import type { User } from '@/types';

const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  username: z.string().min(1, 'Username is required'),
  avatar: z.string().url().or(z.literal('')),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['Co-founder', 'Secretary', 'Chair of Directors', 'Lead', 'Member']),
  team: z.enum(['Technology', 'Corporate', 'Creatives', 'Presidium']).nullable(),
  subTeam: z
    .enum([
      'dev', 'ui-ux', 'aiml', 'cloud', 'iot', 'events', 'ops', 'pr',
      'sponsorship', 'digital-design', 'media',
    ])
    .nullable(),
  phone: z.string().optional().nullable(),
  birthday: z.string().optional().nullable(),
  linkedin: z.string().url().or(z.literal('')).optional().nullable(),
  github: z.string().url().or(z.literal('')).optional().nullable(),
});

export async function updateUser(userData: User) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Not authenticated');

  const authorizedRoles: (string | undefined)[] = ['Co-founder', 'Secretary', 'Chair of Directors'];
  if (!authorizedRoles.includes(currentUser.role)) {
    throw new Error('Not authorized');
  }

  const validatedUser = userSchema.safeParse(userData);

  if (!validatedUser.success) {
    console.error(validatedUser.error.flatten());
    throw new Error('Invalid user data');
  }

  const { id, ...dataToUpdate } = validatedUser.data;

  // Ensure nullable fields are correctly set to null if empty
  const processedData = {
      ...dataToUpdate,
      phone: dataToUpdate.phone || null,
      birthday: dataToUpdate.birthday || null,
      linkedin: dataToUpdate.linkedin || null,
      github: dataToUpdate.github || null,
  };

  if (!adminDb) {
    throw new Error('Database not initialized.');
  }

  await adminDb.collection('users').doc(id).update(processedData);

  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/users');
  revalidatePath(`/dashboard/users/${id}`);
}

export async function seedUsers(usersToSeed: User[]): Promise<User[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Not authenticated');

  const authorizedRoles: (string | undefined)[] = ['Co-founder', 'Secretary', 'Chair of Directors'];
  if (!authorizedRoles.includes(currentUser.role)) {
    throw new Error('Not authorized');
  }

  if (!adminDb) {
    throw new Error('Database not initialized.');
  }

  const usersCollection = adminDb.collection('users');
  
  // Delete all existing users
  const snapshot = await usersCollection.get();
  const batch = adminDb.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Seed new users
  const seedBatch = adminDb.batch();
  for (const user of usersToSeed) {
    // Basic validation, more robust validation can be added
    if (!user.id || !user.name || !user.email) {
        console.warn('Skipping invalid user object during seed:', user);
        continue;
    }
    const docRef = usersCollection.doc(user.id);
    seedBatch.set(docRef, user);
  }
  await seedBatch.commit();
  
  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/users');

  return usersToSeed;
}