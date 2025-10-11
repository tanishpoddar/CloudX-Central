
// This is a server-side file.
'use server';
import { cookies } from 'next/headers';
import { adminDb } from './firebase-admin';
import type { User } from '@/types';

const SESSION_COOKIE_NAME = 'cxc_session';

export async function getCurrentUser(): Promise<User | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) {
        return null;
    }

    if (!adminDb) {
        console.warn('Firebase Admin DB is not initialized. User data from DB is unavailable.');
        return null;
    }

    try {
        const decodedToken = JSON.parse(sessionCookie);
        const userId = decodedToken.userId;

        if (!userId) {
            return null;
        }
        
        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return null;
        }
        const user = { id: userDoc.id, ...userDoc.data() } as User;
        
        return user;
    } catch (error) {
        console.error('Error decoding session cookie:', error);
        const cookieStore = await cookies();
        cookieStore.delete(SESSION_COOKIE_NAME);
        return null;
    }
}

export async function login(email: string, password: string, remember: boolean = false):Promise<void> {
    if (!adminDb) {
        throw new Error('Database not initialized.');
    }
    const usersRef = adminDb.collection("users");
    const q = usersRef.where("email", "==", email);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
        throw new Error("Invalid email address.");
    }

    const userDoc = querySnapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() } as User;

    if (user.password !== password) {
        throw new Error("Incorrect password.");
    }
    
    const sessionData = { 
        userId: user.id,
        loggedInAt: Date.now()
    };

    const sessionDuration = remember
        ? 60 * 60 * 24 * 30 // 30 days
        : 60 * 60 * 24; // 1 day
    
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: sessionDuration,
        path: '/',
    });
}


export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
