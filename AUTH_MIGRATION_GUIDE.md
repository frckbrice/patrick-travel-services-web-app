# Authentication Migration Guide

## Overview

This application has been fully migrated to **Firebase Authentication**, removing all custom JWT implementation. This provides a simpler, more secure, and mobile-friendly authentication system.

## Why Firebase Auth Only?

### Benefits

1. **Simplified Architecture**
   - No need to manage JWT secrets, token generation, or refresh tokens
   - Firebase handles all password hashing, security, and token management
   - Reduced code complexity and maintenance burden

2. **Better Security**
   - Firebase Auth is battle-tested and constantly updated
   - Built-in protection against common vulnerabilities
   - Automatic token refresh and session management

3. **Mobile & Web Compatibility**
   - Same authentication flow works seamlessly for both web and mobile clients
   - Firebase SDK available for React, React Native, iOS, and Android
   - Consistent API across all platforms

4. **Advanced Features Out-of-the-Box**
   - Email verification
   - Password reset
   - Multi-factor authentication (MFA)
   - Social login providers (Google, Facebook, etc.)
   - Anonymous authentication

## Authentication Flow

### For Web Clients (Next.js)

```typescript
// 1. Client-side: Sign in with Firebase
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase-client';

const userCredential = await signInWithEmailAndPassword(auth, email, password);
const idToken = await userCredential.user.getIdToken();

// 2. Call backend to sync user data
const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ firebaseUid: userCredential.user.uid }),
});

// 3. Use ID token for subsequent API calls
const protectedData = await fetch('/api/protected-route', {
    headers: {
        'Authorization': `Bearer ${idToken}`,
    },
});
```

### For Mobile Clients (React Native / Expo)

```typescript
// 1. Sign in with Firebase
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase-config';

const userCredential = await signInWithEmailAndPassword(auth, email, password);
const idToken = await userCredential.user.getIdToken();

// 2. Sync with backend
const response = await axios.post('https://your-api.com/api/auth/login', {
    firebaseUid: userCredential.user.uid,
});

// 3. Use ID token for API calls (axios interceptor example)
axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
```

## API Endpoints

### Registration

**POST** `/api/auth/register`

Creates a user in both Firebase Auth and the database.

**Request:**
```json
{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Registration successful",
    "data": {
        "user": {
            "id": "firebase-uid",
            "email": "user@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "role": "CLIENT",
            "isActive": true,
            "isVerified": false
        },
        "customToken": "firebase-custom-token"
    },
    "meta": {
        "timestamp": "2025-10-15T12:00:00.000Z"
    }
}
```

### Login

**POST** `/api/auth/login`

Syncs user data after Firebase authentication.

**Request:**
```json
{
    "firebaseUid": "firebase-user-id"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": "firebase-uid",
            "email": "user@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "role": "CLIENT",
            "lastLogin": "2025-10-15T12:00:00.000Z"
        }
    }
}
```

### Protected Routes

**GET** `/api/auth/me`

Gets current authenticated user.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "firebase-uid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "CLIENT"
    }
}
```

### Logout

**POST** `/api/auth/logout`

Revokes refresh tokens and logs out user.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

## Token Management

### ID Token Lifecycle

1. **Client obtains ID token** from Firebase after authentication
2. **ID token is short-lived** (1 hour by default)
3. **Firebase SDK auto-refreshes** the token before expiration
4. **Backend verifies** ID token on each request using Firebase Admin SDK

### Getting a Fresh Token

```typescript
// Web/Mobile
import { auth } from './firebase-config';

const user = auth.currentUser;
if (user) {
    const idToken = await user.getIdToken(true); // force refresh
}
```

### Axios Interceptor for Auto Token Refresh

```typescript
import axios from 'axios';
import { auth } from './firebase-config';

axios.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

## Custom Claims (Roles)

Firebase allows storing custom data in tokens:

```typescript
// Backend: Set custom claims
await adminAuth.setCustomUserClaims(userId, {
    role: 'ADMIN',
    permissions: ['read', 'write', 'delete'],
});

// Client: Access custom claims
const user = auth.currentUser;
const idTokenResult = await user.getIdTokenResult();
console.log(idTokenResult.claims.role); // 'ADMIN'
```

## Error Handling

### Common Firebase Auth Errors

| Error Code | Meaning |
|------------|---------|
| `auth/invalid-email` | Email format is invalid |
| `auth/user-disabled` | User account has been disabled |
| `auth/user-not-found` | No user found with this email |
| `auth/wrong-password` | Password is incorrect |
| `auth/email-already-in-use` | Email is already registered |
| `auth/weak-password` | Password doesn't meet requirements |
| `auth/too-many-requests` | Too many failed attempts, temporarily blocked |

### API Response Format

All API endpoints follow a consistent response format:

**Success Response:**
```json
{
    "success": true,
    "message": "Operation successful",
    "data": { },
    "meta": {
        "timestamp": "2025-10-15T12:00:00.000Z"
    }
}
```

**Error Response:**
```json
{
    "success": false,
    "error": "Error message",
    "errors": {
        "field": ["Validation error"]
    },
    "meta": {
        "timestamp": "2025-10-15T12:00:00.000Z"
    }
}
```

## Migration Checklist

If migrating from custom JWT:

- [x] Remove `jsonwebtoken` and `bcryptjs` dependencies
- [x] Delete password hashing utilities
- [x] Update middleware to use Firebase Admin SDK
- [x] Refactor all auth endpoints
- [x] Implement unified API response format
- [ ] Update client-side code to use Firebase Auth SDK
- [ ] Test authentication flow end-to-end
- [ ] Update mobile app authentication

## Environment Variables

```env
# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Firebase Client (Client-side - safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## Best Practices

1. **Always use HTTPS** in production
2. **Validate tokens on every request** using Firebase Admin SDK
3. **Set custom claims** for role-based access control
4. **Handle token refresh** automatically in your client code
5. **Implement proper error handling** for Firebase Auth errors
6. **Use environment variables** for all Firebase configuration
7. **Enable email verification** for production
8. **Implement rate limiting** on auth endpoints

## Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firebase React Native](https://rnfirebase.io/)
- [Custom Claims & RBAC](https://firebase.google.com/docs/auth/admin/custom-claims)

---

**Note:** JWT tokens are no longer used. All authentication is handled by Firebase.

