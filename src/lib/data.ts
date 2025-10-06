
// This is a server-side file.
'use server';

import type { User, Task, Log, Comment, Subtask, Notification, Announcement, AnnouncementComment, AnnouncementReaction, PollVote } from '@/types';
import { adminDb } from './firebase-admin';
import { cache } from 'react';

export const getAllUsers = cache(async (): Promise<User[]> => {
    if (!adminDb) {
        throw new Error('Database not initialized.');
    }
    const usersSnapshot = await adminDb.collection('users').get();

    return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
});

export const getUserById = cache(async (id: string): Promise<User | null> => {
    if (!adminDb) {
        throw new Error('Database not initialized.');
    }
    const userDoc = await adminDb.collection('users').doc(id).get();
    if (!userDoc.exists) {
        return null;
    }
    return { id: userDoc.id, ...userDoc.data() } as User;
});


export const getAllTasks = cache(async (): Promise<Task[]> => {
    if (!adminDb) {
        throw new Error('Database not initialized.');
    }
    const tasksSnapshot = await adminDb.collection('tasks').orderBy('createdAt', 'desc').get();
    return tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
});

export const getTasksByAssigneeId = cache(async (assigneeId: string): Promise<Task[]> => {
    if (!adminDb) {
        throw new Error('Database not initialized.');
    }
    const tasksSnapshot = await adminDb.collection('tasks').where('assignedToIds', 'array-contains', assigneeId).orderBy('createdAt', 'desc').get();
    return tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
});

export const getTaskById = cache(async (id: string): Promise<Task | null> => {
    if (!adminDb) {
        throw new Error('Database not initialized.');
    }
    const taskDoc = await adminDb.collection('tasks').doc(id).get();
    if (!taskDoc.exists) {
        return null;
    }
    return { id: taskDoc.id, ...taskDoc.data() } as Task;
});

export const getAllLogs = cache(async (): Promise<Log[]> => {
    if (!adminDb) {
        throw new Error('Database not initialized.');
    }
    const logsSnapshot = await adminDb.collection('logs').orderBy('timestamp', 'desc').get();
    return logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Log));
});

export const getLogsForTask = async (taskId: string): Promise<Log[]> => {
    if (!adminDb) {
        throw new Error('Database not initialized.');
    }
    const logsSnapshot = await adminDb.collection('logs').where('taskId', '==', taskId).orderBy('timestamp', 'desc').get();
    return logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Log));
};


export const getCommentsForTask = cache(async (taskId: string): Promise<Comment[]> => {
    if (!adminDb) {
        throw new Error('Database not initialized.');
    }
    const commentsSnapshot = await adminDb.collection('comments').where('taskId', '==', taskId).orderBy('createdAt', 'asc').get();
    return commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
});

export const getSubtasksForTask = cache(async (taskId: string): Promise<Subtask[]> => {
    if (!adminDb) {
        throw new Error('Database not initialized.');
    }
    const subtasksSnapshot = await adminDb.collection('subtasks').where('taskId', '==', taskId).orderBy('order', 'asc').get();
    return subtasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subtask));
});

export const getNotificationsForUser = cache(async (userId: string): Promise<Notification[]> => {
    if (!adminDb) {
        throw new Error('Database not initialized.');
    }
    const notificationsSnapshot = await adminDb.collection('notifications').where('userId', '==', userId).orderBy('createdAt', 'desc').limit(50).get();
    return notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
});

export const getAnnouncements = cache(async (): Promise<Announcement[]> => {
    if (!adminDb) {
        throw new Error('Database not initialized.');
    }
    const announcementsSnapshot = await adminDb.collection('announcements').orderBy('createdAt', 'desc').limit(10).get();
    return announcementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
});


export const getCommentsForAnnouncement = cache(async (announcementId: string): Promise<AnnouncementComment[]> => {
    if (!adminDb) {
        throw new Error('Database not initialized.');
    }
    const commentsSnapshot = await adminDb.collection('announcementComments').where('announcementId', '==', announcementId).orderBy('createdAt', 'asc').get();
    return commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnnouncementComment));
});

export const getReactionsForAnnouncements = cache(async (announcementIds: string[]): Promise<AnnouncementReaction[]> => {
    if (!adminDb) {
        throw new Error('Database not initialized.');
    }
    if (announcementIds.length === 0) return [];
    const reactionsSnapshot = await adminDb.collection('announcementReactions').where('announcementId', 'in', announcementIds).get();
    return reactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnnouncementReaction));
});

export const getPollVotesForAnnouncements = cache(async (announcementIds: string[]): Promise<PollVote[]> => {
    if (!adminDb) {
        throw new Error('Database not initialized.');
    }
    if (announcementIds.length === 0) return [];
    const votesSnapshot = await adminDb.collection('pollVotes').where('announcementId', 'in', announcementIds).get();
    return votesSnapshot.docs.map(doc => ({ ...doc.data() } as PollVote));
});
