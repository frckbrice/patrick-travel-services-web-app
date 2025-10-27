# Manual Testing Guide: Agent-Client Messaging

## Prerequisites

1. **Two test users exist:**
   - Agent user: agent@test.com (or your actual agent email)
   - Client user: client@test.com (or your actual client email)

2. **Case is assigned:**
   - A case exists with agent assigned

## Testing Steps

### Option 1: Using the Test Script

```bash
# Install dependencies if needed
npm install firebase-admin

# Edit test-messaging.js and update email addresses
# Then run:
node test-messaging.js
```

### Option 2: Manual Testing via UI

#### Step 1: Login as Agent

1. Open browser and navigate to the app
2. Login as agent (agent@test.com)
3. Go to Cases → Select a case assigned to you

#### Step 2: Open Chat

1. Click on "Messages" in navigation
2. You should see the case in conversations list
3. Click on the conversation

#### Step 3: Send Test Message

1. Type a test message: "Test message from agent to client"
2. Click Send
3. Check browser console for any errors
4. Message should appear immediately in chat

#### Step 4: Login as Client

1. Open new browser window (Incognito/Private)
2. Login as client (client@test.com)
3. Navigate to Messages

#### Step 5: Verify Receipt

1. Client should see the agent's message
2. Message should appear in real-time
3. No page refresh needed

## Debugging

### Check Firebase Realtime Database

1. Go to Firebase Console
2. Navigate to Realtime Database
3. Path: `chats/{caseId}/messages`
4. You should see your messages

### Check Browser Console

```javascript
// In browser console
console.log('Current user:', auth.currentUser);
console.log('User UID:', auth.currentUser.uid);

// Check Firebase connection
import { database } from '@/lib/firebase/firebase-client';
console.log('Database:', database);
```

### Check Network Tab

1. Open DevTools → Network tab
2. Send message
3. Look for:
   - Firebase API calls
   - `/api/chat/archive` calls
   - Any 401/403 errors

## Expected Behavior

✅ **Agent sends message:**

- Message appears immediately in agent's chat
- Message is sent to Firebase Realtime Database
- Message is archived to PostgreSQL
- Console shows: "Message sent and archived"

✅ **Client receives message:**

- Message appears in real-time without refresh
- No delay (sub-second)
- Message is readable
- Console shows no errors

❌ **Common Issues:**

1. **"Firebase user not authenticated"**
   - Solution: Refresh the page, re-login
   - Check Firebase Auth is working

2. **"Permission denied" errors**
   - Solution: Check Firebase rules are deployed
   - Verify user UID matches participant UIDs

3. **Messages not appearing**
   - Solution: Check Firebase connection
   - Verify chat room metadata exists
   - Check browser console for errors

## Quick Verification

Run this in browser console to check status:

```javascript
// Check Firebase Auth
const { auth } = require('@/lib/firebase/firebase-client');
console.log('Current user:', auth.currentUser?.email);
console.log('Firebase UID:', auth.currentUser?.uid);

// Check database connection
const { database } = require('@/lib/firebase/firebase-client');
console.log('Database initialized:', !!database);
```
