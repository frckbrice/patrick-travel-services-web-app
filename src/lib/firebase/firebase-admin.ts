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
        if (!adminAuth) {
            adminAuth = getAuth(adminApp);
        }
        // Don't reinitialize database if it's already initialized
        if (!adminDatabase && process.env.FIREBASE_DATABASE_URL) {
            try {
                adminDatabase = getDatabase(adminApp);
            } catch (error) {
                console.warn('Firebase Realtime Database already initialized or not available');
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
        console.warn(
            'Firebase Admin credentials not found. Firebase Admin features will not be available.'
        );
        return;
    }

    try {
        // Use individual environment variables (most reliable for Next.js)
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        };

        console.log('✅ Initializing Firebase Admin with individual environment variables');
        console.log('   Project ID:', serviceAccount.projectId);
        console.log('   Client Email:', serviceAccount.clientEmail);

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
                console.log('✅ Firebase Realtime Database initialized');
            } catch (dbError) {
                console.warn('⚠️ Firebase Realtime Database not initialized (optional)');
            }
        }

        console.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin:', error instanceof Error ? error.message : 'Unknown error');
    }
};

// Initialize on module load (will skip if no credentials)
initializeFirebaseAdmin();

// Export with null safety - consumers should check for null
export { adminApp, adminAuth, adminDatabase };

