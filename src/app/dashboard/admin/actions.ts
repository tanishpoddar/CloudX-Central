
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase-admin';
import { getCurrentUser } from '@/lib/auth';
import type { User, UserRole, Team, SubTeam } from '@/types';

const userSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  username: z.string().min(1, 'Username is required'),
  regNo: z.string().optional().nullable(),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['Co-founder', 'Secretary', 'Chair of Directors', 'Lead', 'Member']),
  avatar: z.string().url().or(z.literal('')).optional().nullable(),
  team: z.enum(['Technology', 'Corporate', 'Creatives', 'Presidium']).optional().nullable(),
  subTeam: z
    .enum([
      'dev', 'ui-ux', 'aiml', 'cloud', 'iot', 'events', 'ops', 'pr',
      'sponsorship', 'digital-design', 'media',
    ])
    .optional().nullable(),
  phone: z.string().optional().nullable(),
  birthday: z.string().optional().nullable(),
  linkedin: z.string().url().or(z.literal('')).optional().nullable(),
  github: z.string().url().or(z.literal('')).optional().nullable(),
});

export async function updateUser(userData: User) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Not authenticated');

  if (!adminDb) {
    throw new Error('Database not initialized.');
  }

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
      regNo: dataToUpdate.regNo || null,
      phone: dataToUpdate.phone || null,
      birthday: dataToUpdate.birthday || null,
      linkedin: dataToUpdate.linkedin || null,
      github: dataToUpdate.github || null,
  };

  await adminDb.collection('users').doc(id).update(processedData);

  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/users');
  revalidatePath(`/dashboard/users/${id}`);
}

export async function seedUsers(usersJson: string): Promise<User[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Not authenticated');

  if (!adminDb) {
    throw new Error('Database not initialized.');
  }

  const authorizedRoles: (string | undefined)[] = ['Co-founder', 'Secretary', 'Chair of Directors'];
  if (!authorizedRoles.includes(currentUser.role)) {
    throw new Error('Not authorized');
  }

  let usersToSeed: User[];
  try {
    usersToSeed = JSON.parse(usersJson);
  } catch (e) {
    throw new Error("Invalid JSON data provided for seeding.");
  }
  
  for (const user of usersToSeed) {
    const validation = userSchema.safeParse(user);
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      const firstErrorKey = Object.keys(fieldErrors)[0] as keyof typeof fieldErrors;
      const firstErrorMessage = fieldErrors[firstErrorKey]?.[0];
      throw new Error(`Validation failed for user ${user.name || user.id}: ${firstErrorKey} - ${firstErrorMessage || 'Invalid data.'}`);
    }
  }

  const usersCollection = adminDb.collection('users');
  
  // Delete all existing users
  const snapshot = await usersCollection.get();
  const deleteBatch = adminDb.batch();
  snapshot.docs.forEach(doc => {
    deleteBatch.delete(doc.ref);
  });
  await deleteBatch.commit();

  // Seed new users
  const seedBatch = adminDb.batch();
  for (const user of usersToSeed) {
    // Basic validation, more robust validation can be added
    if (!user.id || !user.name || !user.email) {
        console.warn('Skipping invalid user object during seed:', user);
        continue;
    }
    const docRef = usersCollection.doc(user.id);
    const validatedUser = userSchema.safeParse(user);
    if (validatedUser.success) {
      seedBatch.set(docRef, validatedUser.data);
    } else {
       console.warn(`Skipping invalid user data for ${user.id}:`, validatedUser.error.flatten());
    }
  }
  await seedBatch.commit();
  
  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/users');

  // Return the newly seeded users to update the client state
  const newUsersSnapshot = await usersCollection.orderBy('name').get();
  return newUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
}
