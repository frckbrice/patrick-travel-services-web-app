// Firebase Admin SDK configuration for server-side operations

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getDatabase, Database } from 'firebase-admin/database';
import { logger } from '@/lib/utils/logger';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDatabase: Database | null = null;

// Only initialize if credentials are available (skip during build time)
const initializeFirebaseAdmin = () => {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    if (!adminAuth) {
      adminAuth = getAuth(adminApp);
    }
    // Don't reinitialize database if it's already initialized
    if (!adminDatabase && process.env.FIREBASE_DATABASE_URL) {
      try {
        adminDatabase = getDatabase(adminApp);
      } catch (error) {
        logger.warn('Firebase Realtime Database already initialized or not available');
      }
    }
    return;
  }

  // Check if we have the required credentials
  const hasCredentials =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    (process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL);

  if (!hasCredentials) {
    logger.warn(
      'Firebase Admin credentials not found. Firebase Admin features will not be available.'
    );
    return;
  }

  try {
    // Validate required environment variables
    const missingVars: string[] = [];

    if (!process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID.trim() === '') {
      missingVars.push('FIREBASE_PROJECT_ID');
    }
    if (!process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY.trim() === '') {
      missingVars.push('FIREBASE_PRIVATE_KEY');
    }
    if (!process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL.trim() === '') {
      missingVars.push('FIREBASE_CLIENT_EMAIL');
    }

    if (missingVars.length > 0) {
      throw new Error(
        `Missing or empty required Firebase environment variable(s): ${missingVars.join(', ')}`
      );
    }

    // Use individual environment variables (most reliable for Next.js)
    // Safe to use non-null assertion here after validation
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    };

    // Only log sensitive config details in development mode
    logger.debug('Initializing Firebase Admin with individual environment variables', {
      projectId: serviceAccount.projectId,
      clientEmail: serviceAccount.clientEmail,
    });

    const initConfig: {
      credential: ReturnType<typeof cert>;
      databaseURL?: string;
    } = {
      credential: cert(serviceAccount),
    };

    // Only add databaseURL if it exists (optional for Firestore-only apps)
    if (process.env.FIREBASE_DATABASE_URL) {
      initConfig.databaseURL = process.env.FIREBASE_DATABASE_URL;
    }

    adminApp = initializeApp(initConfig);
    adminAuth = getAuth(adminApp);

    // Only initialize Realtime Database if URL is provided (optional - we mainly use Firestore)
    if (process.env.FIREBASE_DATABASE_URL) {
      try {
        adminDatabase = getDatabase(adminApp);
        logger.debug('Firebase Realtime Database initialized');
      } catch (dbError) {
        logger.warn('Firebase Realtime Database not initialized (optional)');
      }
    }

    logger.debug('Firebase Admin initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin', error);
  }
};

// Initialize on module load (will skip if no credentials)
initializeFirebaseAdmin();

// Export with null safety - consumers should check for null
export { adminApp, adminAuth, adminDatabase };
