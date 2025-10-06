
'use server';

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import { redirect } from 'next/navigation';
import type { Team } from "@/types";

async function createNotification(
  userId: string,
  actorId: string,
  type: 'TASK_ASSIGNED' | 'STATUS_UPDATED' | 'COMMENT_ADDED' | 'DEADLINE_APPROACHING' | 'ANNOUNCEMENT_NEW',
  message: string,
  link: string
) {
  if (!adminDb) {
    throw new Error('Database not initialized.');
  }
  await adminDb.collection('notifications').add({
    userId,
    actorId,
    type,
    message,
    link,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
}

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  links: z.array(z.string().url()).optional(),
  isPoll: z.boolean(),
  pollQuestion: z.string().optional(),
  pollOptions: z.array(z.string()).optional(),
  targetDomains: z.array(z.string()).optional(),
});

export async function createAnnouncement(data: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("You must be logged in.");
  }

  if (!adminDb) {
    throw new Error("Database not initialized.");
  }

  const allowedRoles: (string | undefined)[] = ['Co-founder', 'Secretary', 'Chair of Directors'];
  if (!allowedRoles.includes(currentUser.role)) {
    throw new Error("You do not have permission to create announcements.");
  }

  const rawData = {
    title: data.get('title'),
    content: data.get('content'),
    links: data.getAll('links[]').map(l => l.toString()).filter(l => l),
    isPoll: data.get('isPoll') === 'true',
    pollQuestion: data.get('pollQuestion'),
    pollOptions: data.getAll('pollOptions[]').map(opt => opt.toString()).filter(opt => opt),
    targetDomains: data.getAll('targetDomains[]').map(d => d.toString()),
  };

  const validatedFields = announcementSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error(validatedFields.error.flatten());
    throw new Error("Invalid announcement data.");
  }

  const { title, content, links, isPoll, pollQuestion, pollOptions, targetDomains } = validatedFields.data;

  const newAnnouncement: any = {
    title,
    content,
    authorId: currentUser.id,
    createdAt: new Date().toISOString(),
    links: links || [],
    targetDomains: targetDomains || [],
  };

  if (isPoll && pollQuestion && pollOptions && pollOptions.length > 0) {
    newAnnouncement.poll = {
      question: pollQuestion,
      options: pollOptions.map((opt, index) => ({ id: `opt-${index}`, text: opt })),
    };
  }

  
  const docRef = await adminDb.collection("announcements").add(newAnnouncement);

  // Notify users
  const usersSnapshot = await adminDb.collection('users').get();
  const notifMessage = `New announcement posted by <strong>${currentUser.name}</strong>: <strong>${title}</strong>`;

  let targetUserIds = new Set<string>();

  if (!targetDomains || targetDomains.length === 0) {
    // Organization-wide
    usersSnapshot.docs.forEach(doc => targetUserIds.add(doc.id));
  } else {
    // Domain-specific
    usersSnapshot.docs.forEach(doc => {
      const userTeam = doc.data().team;
      if (userTeam && targetDomains.includes(userTeam)) {
        targetUserIds.add(doc.id);
      }
    });
  }

  // Remove the author from the notification list
  targetUserIds.delete(currentUser.id);

  const notificationPromises = Array.from(targetUserIds).map(userId =>
    createNotification(userId, currentUser.id, 'ANNOUNCEMENT_NEW', notifMessage, `/dashboard/announcements#${docRef.id}`)
  );

  await Promise.all(notificationPromises);

  revalidatePath("/dashboard/announcements");
  revalidatePath("/dashboard");
  redirect('/dashboard/announcements');
}

export async function addAnnouncementReaction(announcementId: string, emoji: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Not authenticated");

  if (!adminDb) throw new Error('Database not initialized.');

  const reactionRef = adminDb.collection('announcementReactions').doc(`${announcementId}_${currentUser.id}_${emoji}`);
  const reactionDoc = await reactionRef.get();

  if (reactionDoc.exists) {
    await reactionRef.delete();
  } else {
    await reactionRef.set({
      announcementId,
      userId: currentUser.id,
      emoji,
    });
  }
  revalidatePath('/dashboard/announcements');
}

export async function addAnnouncementComment(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Not authenticated");

  if (!adminDb) throw new Error('Database not initialized.');

  const announcementId = formData.get('announcementId') as string;
  const message = formData.get('message') as string;

  if (!announcementId || !message) throw new Error("Invalid data");

  await adminDb.collection('announcementComments').add({
    announcementId,
    userId: currentUser.id,
    message,
    createdAt: new Date().toISOString(),
  });
  revalidatePath('/dashboard/announcements');
}

export async function submitPollVote(announcementId: string, optionId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Not authenticated");

  if (!adminDb) throw new Error('Database not initialized.');

  // Use a composite ID to ensure a user can only vote once per poll
  const voteRef = adminDb.collection('pollVotes').doc(`${announcementId}_${currentUser.id}`);

  await voteRef.set({
    announcementId,
    userId: currentUser.id,
    optionId,
  });

  revalidatePath('/dashboard/announcements');
}
