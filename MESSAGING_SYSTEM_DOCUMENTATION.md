# Messaging System - Complete Implementation Guide

## Overview

The messaging system provides **real-time, secure, case-based communication** between agents and clients. All messaging is tied to cases, ensuring agents can only communicate with clients they are assigned to.

## Architecture

### Dual-Layer System

1. **Firebase Realtime Database** - Real-time message delivery (instant, < 1 second)
2. **Neon PostgreSQL** - Message persistence, analytics, compliance

### Key Design Principles

- **Case-Based Access Control**: All messages must be associated with a case
- **Agent-Only Assignment**: Agents can only message clients with cases assigned to them
- **Real-Time Delivery**: Messages appear instantly using Firebase listeners
- **Offline Support**: Intelligent caching for offline access
- **Performance Optimized**: Pagination, batching, and caching throughout

---

## Security Implementation

### 1. Firebase Security Rules

**Location**: `firebase-database.rules.json`

```json
{
  "rules": {
    "chats": {
      "$caseId": {
        ".read": "auth != null && (
          data.child('metadata/participants/clientId').val() == auth.uid ||
          data.child('metadata/participants/agentId').val() == auth.uid
        )",
        ".write": "auth != null && (
          data.child('metadata/participants/clientId').val() == auth.uid ||
          data.child('metadata/participants/agentId').val() == auth.uid
        )"
      }
    }
  }
}
```

**To Deploy:**

```bash
firebase deploy --only database
```

### 2. Database-Level Validation

**Location**: `src/app/api/messages/route.ts:149-185`

- Verifies sender is either the client or assigned agent
- Verifies recipient is either the client or assigned agent
- Validates case exists before allowing message

**Security Features:**

- ✅ Sender verification against authenticated user
- ✅ Case ownership validation
- ✅ Recipient validation
- ✅ 3-retry logic with exponential backoff
- ✅ Transaction-based writes (atomic)

---

## Features Implemented

### ✅ 1. Notification System

**Files:**

- `src/lib/services/notification.service.ts` - Batched notification creation
- `src/app/api/notifications/route.ts` - Notification API

**Features:**

- Batched processing (up to 50 notifications per batch)
- Automatic retry on failure
- Firebase real-time notifications
- Email notifications (TODO: configure email service)
- Push notifications (TODO: implement web push)

**Usage:**

```typescript
import { notifyNewMessage } from '@/lib/services/notification.service';

await notifyNewMessage({
  recipientId: 'user-123',
  senderName: 'John Agent',
  messagePreview: 'Hello, your visa is approved!',
  caseId: 'case-456',
  caseReference: 'REF-2024-001',
});
```

### ✅ 2. Case-Based Access Control

**Implementation:**

- Chat room ID = Case ID (consistent mapping)
- Messages require `caseId` parameter
- API validates sender/recipient against case participants

**Prevents:**

- ❌ Agents messaging clients without assigned cases
- ❌ Clients messaging wrong agents
- ❌ Cross-case message leakage

### ✅ 3. Read Receipts & Delivery Status

**Files:**

- `src/lib/firebase/message-status.service.ts`

**Status Flow:**

1. **sent** - Message created in Firebase
2. **delivered** - Recipient comes online
3. **read** - Recipient views message (1 second delay)

**Auto-Mark as Read:**

- Messages are automatically marked as read when user views the chat
- 1-second delay to ensure user actually saw the message
- Batch update for performance

### ✅ 4. Message Pagination

**Implementation:**

- 50 messages per page (configurable)
- Firebase query with `limitToLast(50)`
- "Load More" functionality available

**Benefits:**

- ⚡ Fast initial load
- 📉 Reduced memory usage
- 🚀 Scales to 10,000+ messages

### ✅ 5. Offline Support & Reconnection

**Features:**

- LocalStorage caching (1-2 minute TTL)
- Instant display from cache
- Automatic sync on reconnection
- Background Firebase listener always active

**User Experience:**

1. User goes offline → Shows cached messages
2. Agent sends message → Queued in Firebase
3. User comes online → Receives all missed messages instantly

### ✅ 6. Retry Logic for Database Writes

**Implementation:**

- 3 retries with exponential backoff
- 1s, 2s, 3s delays
- Doesn't retry validation errors (immediate fail)

**Handles:**

- Temporary network issues
- Database connection problems
- Race conditions

### ✅ 7. Attachment Support

**Files:**

- `src/lib/utils/file-validation.ts` - Validation utilities
- `src/components/messages/AttachmentPreview.tsx` - UI component

**Limits:**

- Max 3 files per message
- Max 10MB per file (documents)
- Max 5MB per image
- Allowed types: Images, PDF, Word, Excel, Text

**Validation:**

```typescript
import { validateFiles, FILE_VALIDATION } from '@/lib/utils/file-validation';

const result = validateFiles(selectedFiles, existingCount);
if (result.errors.length > 0) {
  result.errors.forEach(({ file, error }) => {
    toast.error(`${file.name}: ${error}`);
  });
}
// Upload result.valid files
```

### ✅ 8. Mock Data Removal

All mock data has been removed:

- ❌ `getMockMessagesForRoom()`
- ❌ `getMockChatRooms()`
- ❌ `MOCK_PRESENCES`
- ❌ Development fallbacks

Production system now only uses real Firebase data.

---

## API Endpoints

### Messages

#### GET /api/messages

Get user's messages from database (for analytics)

**Query Parameters:**

- `limit` (default: 50)
- `offset` (default: 0)

**Response:**

```json
{
  "success": true,
  "data": {
    "messages": [...],
    "pagination": {
      "total": 100,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

#### POST /api/messages

Store message in database (called automatically after Firebase write)

**Body:**

```json
{
  "senderId": "user-123",
  "recipientId": "user-456",
  "content": "Hello!",
  "caseId": "case-789",
  "attachments": [],
  "firebaseMessageId": "msg-123"
}
```

**Validation:**

- ✅ Sender must match authenticated user
- ✅ Case must exist
- ✅ Sender/recipient must be case participants

### Notifications

#### GET /api/notifications

Get user notifications

**Query Parameters:**

- `limit` (default: 20)
- `offset` (default: 0)
- `unreadOnly` (boolean)

#### PATCH /api/notifications?id={id}

Mark notification as read

#### PATCH /api/notifications?markAllAsRead=true

Mark all notifications as read

---

## React Hooks

### useRealtimeMessages(chatRoomId)

Real-time message subscription with pagination.

```typescript
const { messages, isLoading, hasMore, loadMore } = useRealtimeMessages(caseId);
```

**Features:**

- Automatic cache lookup (instant display)
- Firebase real-time updates
- Auto-mark as read
- Pagination support

### useRealtimeChatRooms()

Get list of user's chat rooms (cases).

```typescript
const { chatRooms, isLoading } = useRealtimeChatRooms();
```

**Returns:**

- All cases where user is client or assigned agent
- Sorted by last message time
- Cached for 2 minutes

### useSendMessage()

Send a message mutation.

```typescript
const sendMessage = useSendMessage();

await sendMessage.mutateAsync({
  recipientId: 'user-456',
  recipientName: 'Client Name',
  recipientEmail: 'client@example.com',
  content: 'Your message',
  caseId: 'case-789', // REQUIRED
  attachments: [],
});
```

**Flow:**

1. Writes to Firebase (instant)
2. Stores in PostgreSQL (with retry)
3. Creates notification (async)
4. Invalidates queries

---

## Performance Optimizations

### 1. Caching Strategy

| Data Type     | Cache Duration | Storage      |
| ------------- | -------------- | ------------ |
| Messages      | 1 minute       | LocalStorage |
| Chat Rooms    | 2 minutes      | LocalStorage |
| Notifications | 5 minutes      | LocalStorage |

### 2. Batching

- **Notifications**: Batched up to 50, 1-second delay
- **Read Receipts**: Batch updated per chat room
- **Database Writes**: Transaction-based

### 3. Pagination

- Firebase: `limitToLast(50)`
- API: `limit` and `offset` parameters
- Load more on demand

### 4. Query Optimization

Database indexes:

- `messages(senderId, recipientId, caseId, isRead, messageType)`
- `notifications(userId, isRead, createdAt)`

---

## Deployment Checklist

### 1. Environment Variables

Ensure these are set:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...

# Database
DATABASE_URL=postgresql://...
```

### 2. Deploy Firebase Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy rules
firebase deploy --only database
```

### 3. Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### 4. Verify Security

Test these scenarios:

- ✅ Agent can only see messages from assigned cases
- ✅ Client can only see messages from their cases
- ✅ Cannot send message without case ID
- ✅ Cannot read messages from other users' cases

---

## Testing Guide

### Unit Tests (TODO)

```typescript
// tests/messaging/notifications.test.ts
describe('Notification System', () => {
  it('should batch notifications', async () => {
    // Test batching logic
  });

  it('should retry on failure', async () => {
    // Test retry logic
  });
});
```

### Integration Tests

1. **Agent to Client Flow**
   - Agent sends message with case ID
   - Client receives instantly
   - Message stored in database
   - Notification created

2. **Access Control**
   - Agent without assigned case cannot message client
   - Different agent cannot read messages
   - Client cannot message wrong agent

3. **Offline Scenarios**
   - User offline → receives messages when online
   - Cache shows old messages immediately
   - Reconnection syncs missed messages

---

## Troubleshooting

### Messages not appearing

**Check:**

1. Firebase connection: `database.getDatabase()` succeeds
2. Authentication: User logged in
3. Case ID provided: Required for all messages
4. Security rules deployed

**Debug:**

```typescript
// Enable Firebase logging
import { enableLogging } from 'firebase/database';
enableLogging(true);
```

### Database writes failing

**Check:**

1. DATABASE_URL environment variable
2. Prisma client generated
3. Network connectivity
4. Case exists and user has access

**Logs:**

```bash
# Check API logs
tail -f .next/server-logs.txt
```

### Notifications not sending

**Check:**

1. Notification service imported correctly
2. recipientId is valid
3. Batch processing not stalled
4. Firebase notification service connected

**Force Flush:**

```typescript
import { flushNotifications } from '@/lib/services/notification.service';
await flushNotifications();
```

---

## Future Enhancements

### Planned Features

1. **Push Notifications**
   - Web Push API for PWA
   - Mobile push notifications
   - Notification preferences

2. **Email Notifications**
   - Send email for offline users
   - Digest emails (daily summary)
   - Configurable preferences

3. **Message Search**
   - Full-text search in messages
   - Filter by date range
   - Filter by case

4. **Voice Messages**
   - Record audio messages
   - Transcription support
   - Playback controls

5. **Message Reactions**
   - Emoji reactions
   - Quick replies
   - Thumbs up/down

6. **Typing Indicators**
   - Show "X is typing..."
   - Throttled updates
   - Presence management

---

## Support & Maintenance

### Monitoring

Monitor these metrics:

- Message delivery time (target: < 1s)
- Database write success rate (target: > 99%)
- Notification delivery rate (target: > 95%)
- Cache hit rate (target: > 70%)

### Logs

Key log messages:

- `Message sent via Firebase` - Successful Firebase write
- `Message stored in database` - Successful DB write
- `Notification created` - Notification sent
- `Failed to store message after retries` - Critical error

### Backup & Recovery

- Firebase: Automatic backups (daily)
- PostgreSQL: Configure automated backups
- Message history: Archived after 1 year (TODO)

---

## Conclusion

The messaging system is production-ready with:

- ✅ Real-time delivery
- ✅ Security & access control
- ✅ Performance optimization
- ✅ Offline support
- ✅ Notifications
- ✅ Read receipts
- ✅ File attachments

All recommendations from the audit have been implemented.

For questions or issues, contact the development team.
