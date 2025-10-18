// Firebase client configuration for Patrick Travel Services

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { logger } from '@/lib/utils/logger';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let database: Database;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  database = getDatabase(app);

  // Explicitly set persistence to LOCAL to maintain sessions across page reloads
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    logger.error('Failed to set Firebase Auth persistence', error);
  });
} else {
  app = getApps()[0];
  auth = getAuth(app);
  database = getDatabase(app);
}

export { app, auth, database };
