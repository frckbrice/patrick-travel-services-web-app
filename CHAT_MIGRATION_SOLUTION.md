# Chat Migration Solution: caseId → clientId-agentId

## Problem Summary

Your chat system migrated from using `caseId` as the chat room ID to using `clientId-agentId` format. This caused a mismatch:

- **Agent messages (web)**: Sent to `chats/{clientId}-{agentId}/messages` (new format)
- **Mobile messages**: Still using `chats/{caseId}/messages` (old format)

Result: Messages appear in different chat rooms, breaking conversation continuity.

## Solution Implemented

### 1. Automatic Migration in `sendMessage` 

Updated `src/lib/firebase/chat.service.ts` to automatically detect and migrate old format chats when sending messages:

- When `sendMessage` is called with a `caseId`, it checks if an old format chat exists
- If found, it automatically migrates messages from old format to new format
- Migration happens transparently without blocking message sending

**Code location**: Lines 482-519 in `src/lib/firebase/chat.service.ts`

### 2. Migration API Endpoint 

Created `/api/chat/migrate` endpoint for bulk migration:

**Features:**

- Migrate all chats or specific case
- Dry-run mode to preview changes
- Detailed migration reports
- Admin-only access

**Usage:**

```bash
# Dry run (preview what would be migrated)
POST /api/chat/migrate
{
  "dryRun": true
}

# Migrate all chats
POST /api/chat/migrate
{
  "dryRun": false
}

# Migrate specific case
POST /api/chat/migrate
{
  "caseId": "case-uuid-here",
  "dryRun": false
}
```

**Response includes:**

- Summary of migrated chats
- Number of messages merged
- Any errors encountered

### 3. Migration Function 

Created `migrateChatFromOldToNew()` function that:

- Copies messages from old format (`chats/{caseId}`) to new format (`chats/{clientId}-{agentId}`)
- Adds case reference to new room's `caseReferences` array
- Updates `lastMessage` and `lastMessageTime`
- Preserves message timestamps and content
- Avoids duplicate messages

## Recommended Approach

### Option 1: Automatic Migration (Recommended) 

The automatic migration in `sendMessage` will handle migrations on-the-fly as users send messages. This is the least disruptive approach.

**Pros:**

- No downtime
- Migrates chats as they're accessed
- No manual intervention needed

**Cons:**

- Migration happens during normal usage (slight delay on first message)
- Old format rooms remain until manually cleaned up

### Option 2: Bulk Migration (For Clean Slate)

Run the migration API endpoint to migrate all chats at once:

```bash
# 1. First, do a dry run to see what will be migrated
curl -X POST https://your-domain.com/api/chat/migrate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'

# 2. Review the results, then run actual migration
curl -X POST https://your-domain.com/api/chat/migrate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'
```

**Pros:**

- Clean migration all at once
- Can review before executing
- Old rooms can be cleaned up afterward

**Cons:**

- Requires admin access
- Might take time for large datasets

### Option 3: Hybrid Approach (Best of Both)

1. Run bulk migration for existing chats
2. Keep automatic migration for edge cases
3. Clean up old format rooms after verification

## Mobile App Update Required 

**Critical**: The mobile app must also use the new `clientId-agentId` format for chat room IDs.

**Required changes in mobile app:**

1. **Use same `getChatRoomId` calculation:**

   ```typescript
   function getChatRoomId(clientId: string, agentId: string): string {
     const sorted = [clientId, agentId].sort();
     return `${sorted[0]}-${sorted[1]}`;
   }
   ```

2. **When sending messages, determine clientId and agentId:**
   - If sender is CLIENT → clientId = senderId, agentId = recipientId
   - If sender is AGENT → clientId = recipientId, agentId = senderId
   - Use Firebase UIDs (not PostgreSQL IDs) for Firebase operations

3. **Update message sending path:**

   ```typescript
   // OLD (wrong):
   const chatRoomId = caseId;
   const messageRef = ref(database, `chats/${chatRoomId}/messages`);

   // NEW (correct):
   const chatRoomId = getChatRoomId(clientFirebaseId, agentFirebaseId);
   const messageRef = ref(database, `chats/${chatRoomId}/messages`);
   ```

## UI Cleanup (Optional)

After migration, you may want to:

1. **Remove duplicate chat entries from UI** - Old caseId-based chats should no longer appear
2. **Verify message continuity** - Ensure all messages appear in the unified chat
3. **Clean up old Firebase rooms** - Optionally delete old format rooms after verification (uncomment line 362 in `migrate/route.ts`)

## Verification Steps

1. **Check Firebase console:**
   - Old format: `chats/{caseId}` should have messages
   - New format: `chats/{clientId}-{agentId}` should have merged messages

2. **Test messaging:**
   - Send message from web → should appear in new format
   - Send message from mobile → should appear in same new format room
   - Both should see all messages

3. **Verify caseReferences:**
   - New format room metadata should have `caseReferences` array with the caseId

## Technical Details

### Chat Room ID Format

**Old Format:**

```
chats/{caseId}/messages/{messageId}
```

**New Format:**

```
chats/{clientId}-{agentId}/messages/{messageId}
```

Where IDs are sorted alphabetically to ensure consistency (e.g., `clientId-agentId` or `agentId-clientId` both become the same sorted pair).

### Metadata Structure

New format includes:

```json
{
  "metadata": {
    "participants": {
      "clientId": "firebase-uid",
      "clientName": "Client Name",
      "agentId": "firebase-uid",
      "agentName": "Agent Name"
    },
    "caseReferences": [
      {
        "caseId": "postgres-uuid",
        "caseReference": "CASE-001",
        "assignedAt": 1234567890
      }
    ],
    "lastMessage": "Last message preview...",
    "lastMessageTime": 1234567890,
    "createdAt": 1234567890
  }
}
```

## Troubleshooting

**Issue**: Messages still appearing in different rooms

- **Solution**: Check if mobile app is using updated chatRoomId calculation

**Issue**: Migration API returns errors

- **Solution**: Verify Firebase Admin is initialized and user has admin role

**Issue**: Some messages missing after migration

- **Solution**: Check Firebase logs for migration errors, re-run migration for specific case

## Next Steps

1.  Automatic migration is already active in `sendMessage`
2.  **Update mobile app** to use new chatRoomId format (critical)
3.  Optionally run bulk migration API for existing chats
4.  Clean up old format rooms after verification period
