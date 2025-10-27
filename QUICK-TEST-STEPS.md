# Quick Test Steps - Agent to Client Messaging

## 🚀 Fastest Way to Test

### Step 1: Open Application

```bash
npm run dev
# Navigate to http://localhost:3000
```

### Step 2: As AGENT

1. Login as agent
2. Go to any assigned case
3. Click "Messages" button or navigate to Messages page
4. Select the conversation with your client
5. Send test message: "Hello client, this is a test!"

### Step 3: As CLIENT

1. Open new browser window (Incognito mode)
2. Login as client
3. Go to Messages
4. You should see the agent's message appear in real-time

## ✅ What to Verify

### In Browser Console (F12 → Console)

Look for these logs:

```
✅ Using Firebase UID for message sending
✅ Message sent to Firebase
✅ Message archived to PostgreSQL
✅ Message sent and archived
```

### In Firebase Console

1. Go to Firebase Console → Realtime Database
2. Navigate to `chats/{caseId}/messages`
3. You should see your message with:
   - `senderId`: Firebase UID
   - `content`: Your message
   - `caseId`: Case ID
   - `sentAt`: Timestamp

## 🐛 If Messages Don't Appear

### Check 1: Firebase Connection

```javascript
// In browser console
console.log('Firebase connected:', window.firebase?.auth()?.currentUser);
```

### Check 2: User Authentication

```javascript
import { auth } from '@/lib/firebase/firebase-client';
console.log('Current user:', auth.currentUser?.uid);
```

### Check 3: Network Requests

1. Open DevTools → Network tab
2. Look for Firebase websocket connections
3. Should see: `wss://{project-id}-default-rtdb.firebaseio.com/.ws`

## 📊 Success Indicators

✅ **Message sending works if:**

- Agent sends message → appears immediately in agent's chat
- No console errors
- Network tab shows Firebase connections
- Message saved to Firebase Realtime Database

✅ **Message receiving works if:**

- Client's browser shows message in real-time
- No page refresh needed
- Message appears in client's chat interface

## 🔧 Common Fixes

**Issue**: "Firebase user not authenticated"

```javascript
// Check in browser console
auth.currentUser; // Should not be null
```

**Issue**: "Permission denied"

```bash
# Deploy Firebase rules
firebase deploy --only database
```

**Issue**: "No messages in Firebase"

- Check: `chatRoomId` is correct
- Check: `caseId` exists in chats metadata
- Check: Firebase rules allow read/write
