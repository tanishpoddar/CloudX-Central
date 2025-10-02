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

    try {
        // Since we are not verifying the token against Firebase Auth service here,
        // we are trusting the cookie content. This is acceptable for this internal demo app.
        // In a production app, you'd want to use a library like `jose` to verify a JWT.
        const decodedToken = JSON.parse(sessionCookie);
        const userId = decodedToken.userId;

        if (!userId) {
            return null;
        }
        
        if (!adminDb) {
            throw new Error('Database not initialized.');
        }
        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return null;
        }
        const user = { id: userDoc.id, ...userDoc.data() } as User;
        
        return user;
    } catch (error) {
        console.error('Error decoding session cookie:', error);
        // If the cookie is invalid, delete it.
        const cookieStore = await cookies();
        cookieStore.delete(SESSION_COOKIE_NAME);
        return null;
    }
}

export async function login(email: string, password: string):Promise<void> {
    if (!adminDb) {
        throw new Error('Database not initialized.');
    }
    const usersRef = adminDb.collection("users");
    const q = usersRef.where("email", "==", email);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
        throw new Error("Invalid email or password.");
    }

    const userDoc = querySnapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() } as User;

    // In a real app, you MUST hash passwords.
    // This is a major security vulnerability.
    if (user.password !== password) {
        throw new Error("Invalid email or password.");
    }
    
    const sessionData = { 
        userId: user.id,
        loggedInAt: Date.now()
    };
    
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // One week
        path: '/',
    });
}


export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
