import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';
import { users, tasks, logs } from './seed-data';

// IMPORTANT: Replace with your actual service account key JSON file path
// You can download this from your Firebase project settings
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.projectId,
});

const db = getFirestore();

async function seedDatabase() {
  console.log('Starting to seed database...');

  // Seed users
  const usersCollection = db.collection('users');
  for (const user of users) {
    await usersCollection.doc(user.id).set(user);
    console.log(`Seeded user: ${user.name}`);
  }

  // Seed tasks
  const tasksCollection = db.collection('tasks');
  for (const task of tasks) {
      await tasksCollection.doc(task.id).set(task);
      console.log(`Seeded task: ${task.title}`);
  }

  // Seed logs
  const logsCollection = db.collection('logs');
  for (const log of logs) {
      await logsCollection.doc(log.id).set(log);
      console.log(`Seeded log: ${log.message}`);
  }

  console.log('Database seeding completed successfully!');
}

seedDatabase().catch(error => {
  console.error('Error seeding database:', error);
});
