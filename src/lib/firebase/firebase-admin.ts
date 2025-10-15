// Firebase Admin SDK configuration for server-side operations

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getDatabase, Database } from 'firebase-admin/database';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDatabase: Database | null = null;

// Only initialize if credentials are available (skip during build time)
const initializeFirebaseAdmin = () => {
    if (getApps().length > 0) {
        adminApp = getApps()[0];
        adminAuth = getAuth(adminApp);
        adminDatabase = getDatabase(adminApp);
        return;
    }

    // Check if we have the required credentials
    const hasCredentials =
        process.env.FIREBASE_SERVICE_ACCOUNT ||
        (process.env.FIREBASE_PROJECT_ID &&
            process.env.FIREBASE_PRIVATE_KEY &&
            process.env.FIREBASE_CLIENT_EMAIL);

    if (!hasCredentials) {
        console.warn(
            'Firebase Admin credentials not found. Firebase Admin features will not be available.'
        );
        return;
    }

    try {
        // Initialize Firebase Admin with service account
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : {
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            };

        adminApp = initializeApp({
            credential: cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL,
        });

        adminAuth = getAuth(adminApp);
        adminDatabase = getDatabase(adminApp);
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
    }
};

// Initialize on module load (will skip if no credentials)
initializeFirebaseAdmin();

// Export with null safety - consumers should check for null
export { adminApp, adminAuth, adminDatabase };

