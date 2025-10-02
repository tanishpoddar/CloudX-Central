import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    // Validate required fields before initializing
    if (!serviceAccount.projectId) {
      throw new Error('FIREBASE_PROJECT_ID environment variable is not set');
    }
    
    if (!serviceAccount.clientEmail) {
      throw new Error('FIREBASE_CLIENT_EMAIL environment variable is not set');
    }
    
    if (!serviceAccount.privateKey) {
      throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.projectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    // Fallback for environments where Firebase Admin isn't needed
    // This helps prevent build failures in environments like Vercel preview builds
  }
}

const adminDb = admin.apps.length ? admin.firestore() : null;
const adminAuth = admin.apps.length ? admin.auth() : null;
const adminStorage = admin.apps.length ? admin.storage() : null;

export { adminDb, adminAuth, adminStorage };
