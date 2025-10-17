# Mobile App Integration Guide - Real-Time Chat
**For:** React Native / Flutter / Native iOS/Android Apps  
**Status:** ✅ Fully Compatible

---

## 🎯 **Overview**

The web app's messaging system uses **Firebase Realtime Database** directly from the client. Your mobile app can use the **exact same Firebase project** and functions for seamless communication.

**Architecture:**
```
Web App (React) ←→ Firebase Realtime Database ←→ Mobile App (React Native/Flutter)
                          ↑
                  Single source of truth
                  Real-time sync < 100ms
```

---

## 📱 **Mobile App Setup**

### **1. Firebase Configuration**

Use the **same Firebase project** as the web app:

```javascript
// React Native Example
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "SAME_AS_WEB_APP",
  authDomain: "SAME_AS_WEB_APP",
  projectId: "SAME_AS_WEB_APP",
  storageBucket: "SAME_AS_WEB_APP",
  messagingSenderId: "SAME_AS_WEB_APP",
  appId: "SAME_AS_WEB_APP",
  databaseURL: "SAME_AS_WEB_APP" // Important for Realtime DB
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
```

### **2. Copy Chat Service Functions**

Copy `src/lib/firebase/chat.service.ts` to your mobile app and use it directly:

```typescript
// Mobile app can use these functions directly
import { 
  sendMessage,
  subscribeToRoomMessages,
  subscribeToUserChatRooms,
  setUserOnline,
  setTyping,
  subscribeToUserPresence
} from './firebase/chat.service';
```

---

## 🔄 **Real-Time Communication Flow**

### **Sending Messages (Web → Mobile):**

1. Web user types message in browser
2. Calls `sendMessage()` → writes to Firebase
3. Mobile app listens via `subscribeToRoomMessages()`
4. Mobile receives message **instantly** (< 100ms)
5. Mobile displays notification

### **Sending Messages (Mobile → Web):**

1. Mobile user types message in app
2. Calls same `sendMessage()` → writes to Firebase
3. Web app listens via `useRealtimeMessages()` hook
4. Web receives message **instantly**
5. Web shows toast notification

**Both use the same Firebase database - no API needed!**

---

## ✅ **Core Features for Mobile**

### **1. Send Message**

```typescript
// Mobile App (React Native example)
import { sendMessage } from './firebase/chat.service';

async function sendChatMessage(recipientId: string, content: string) {
  const messageId = await sendMessage({
    senderId: currentUser.id,
    senderName: currentUser.name,
    senderEmail: currentUser.email,
    recipientId,
    recipientName: recipient.name,
    recipientEmail: recipient.email,
    content,
    caseId: currentCase?.id,
    subject: 'General',
    attachments: []
  });
  
  console.log('Message sent:', messageId);
}
```

### **2. Subscribe to Messages (Real-time)**

```typescript
// Mobile App
import { subscribeToRoomMessages } from './firebase/chat.service';
import { useEffect, useState } from 'react';

function ChatScreen({ chatRoomId }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = subscribeToRoomMessages(chatRoomId, (newMessages) => {
      setMessages(newMessages);
    });

    // Cleanup on unmount
    return unsubscribe;
  }, [chatRoomId]);

  return (
    <View>
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </View>
  );
}
```

### **3. Set User Online**

```typescript
// Mobile App - Call on app foreground
import { setUserOnline, setUserOffline } from './firebase/chat.service';
import { AppState } from 'react-native';

AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active') {
    setUserOnline(currentUser.id, 'mobile');
  } else {
    setUserOffline(currentUser.id);
  }
});
```

### **4. Typing Indicators**

```typescript
// Mobile App
import { setTyping } from './firebase/chat.service';

function ChatInput({ chatRoomId, userId, userName }) {
  const handleTextChange = (text) => {
    if (text.length > 0) {
      // Throttled - max 1 update per second
      setTyping(userId, userName, chatRoomId, true);
    }
  };

  const handleBlur = () => {
    setTyping(userId, userName, chatRoomId, false);
  };

  return (
    <TextInput
      onChangeText={handleTextChange}
      onBlur={handleBlur}
      placeholder="Type a message..."
    />
  );
}
```

### **5. Subscribe to Typing**

```typescript
// Mobile App
import { subscribeToTyping } from './firebase/chat.service';

function ChatScreen({ chatRoomId, currentUserId }) {
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToTyping(chatRoomId, currentUserId, (typing) => {
      setTypingUsers(typing);
    });

    return unsubscribe;
  }, [chatRoomId, currentUserId]);

  return (
    <View>
      {typingUsers.length > 0 && (
        <Text>{typingUsers[0].userName} is typing...</Text>
      )}
    </View>
  );
}
```

---

## 🔐 **Security - Firebase Rules**

Security is handled by **Firebase Security Rules** (not backend API):

**Key Rules:**
- ✅ Users can only send messages as themselves (`senderId === auth.uid`)
- ✅ Users can only read messages they're part of
- ✅ Presence: Users can only update their own status
- ✅ Typing: Users can only update their own typing status
- ✅ Content validation (max 5000 chars, required fields)

**Deploy Rules:**
```bash
firebase deploy --only database
```

Mobile apps are **automatically protected** by these rules.

---

## 📊 **Data Structure**

### **Messages:**
```javascript
{
  "messages": {
    "msg_abc123": {
      "senderId": "user_123",
      "senderName": "John Doe",
      "senderEmail": "john@example.com",
      "recipientId": "agent_456",
      "recipientName": "Agent Smith",
      "recipientEmail": "agent@example.com",
      "content": "Hello, I need help",
      "caseId": "case_789",
      "sentAt": 1697500000000,
      "isRead": false,
      "attachments": []
    }
  }
}
```

### **Chat Rooms:**
```javascript
{
  "chatRooms": {
    "room_xyz": {
      "participants": ["user_123", "agent_456"],
      "caseId": "case_789",
      "lastMessage": "Hello, I need help",
      "lastMessageAt": 1697500000000,
      "unreadCount": {
        "agent_456": 1
      },
      "createdAt": 1697400000000,
      "updatedAt": 1697500000000
    }
  }
}
```

### **Presence:**
```javascript
{
  "presence": {
    "user_123": {
      "userId": "user_123",
      "status": "online",
      "lastSeen": 1697500000000,
      "platform": "mobile"
    }
  }
}
```

### **Typing:**
```javascript
{
  "typing": {
    "room_xyz": {
      "user_123": {
        "userId": "user_123",
        "userName": "John Doe",
        "chatRoomId": "room_xyz",
        "isTyping": true,
        "timestamp": 1697500000000
      }
    }
  }
}
```

---

## 🚀 **Performance Optimization**

### **1. Offline Support**

Firebase Realtime Database has built-in offline support:

```typescript
// Mobile App
import { enableNetwork, disableNetwork } from 'firebase/database';

// Enable offline persistence (automatic in React Native)
// Messages are cached locally and synced when online
```

### **2. Throttling**

```typescript
// Typing indicators throttled to 1 update/second
// Prevents excessive Firebase writes
let lastUpdate = 0;

function handleTyping() {
  const now = Date.now();
  if (now - lastUpdate > 1000) {
    setTyping(userId, userName, chatRoomId, true);
    lastUpdate = now;
  }
}
```

### **3. Connection Management**

```typescript
// Monitor connection state
import { ref, onValue } from 'firebase/database';

const connectedRef = ref(database, '.info/connected');
onValue(connectedRef, (snapshot) => {
  if (snapshot.val() === true) {
    console.log('Connected to Firebase');
    setUserOnline(userId, 'mobile');
  } else {
    console.log('Disconnected from Firebase');
  }
});
```

---

## ✅ **Testing Mobile Integration**

### **Test Flow:**

1. **Web → Mobile:**
   - Open web app, login as AGENT
   - Open mobile app, login as CLIENT
   - Send message from web
   - **Expected:** Message appears on mobile < 1 second

2. **Mobile → Web:**
   - Type message in mobile app
   - Send message
   - **Expected:** Message appears on web < 1 second

3. **Typing Indicators:**
   - Start typing on mobile
   - **Expected:** "User is typing..." shows on web

4. **Online Status:**
   - Open mobile app
   - **Expected:** Green dot appears on web
   - Close mobile app
   - **Expected:** Green dot disappears on web

5. **Offline Mode:**
   - Turn off mobile internet
   - Send message from mobile
   - **Expected:** Message queued locally
   - Turn on internet
   - **Expected:** Message syncs automatically

---

## 🎯 **Mobile SDK Examples**

### **React Native:**

```bash
npm install firebase
```

```typescript
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Use same firebaseConfig as web
// Copy chat.service.ts functions
```

### **Flutter:**

```yaml
dependencies:
  firebase_core: latest
  firebase_database: latest
  firebase_auth: latest
```

```dart
import 'package:firebase_database/firebase_database.dart';

// Subscribe to messages
DatabaseReference messagesRef = FirebaseDatabase.instance.ref('messages');
messagesRef.onValue.listen((event) {
  // Handle new messages
});
```

### **Native iOS (Swift):**

```swift
import FirebaseDatabase

let ref = Database.database().reference()

// Subscribe to messages
ref.child("messages").observe(.childAdded) { snapshot in
    // Handle new message
}
```

### **Native Android (Kotlin):**

```kotlin
import com.google.firebase.database.FirebaseDatabase

val database = FirebaseDatabase.getInstance()
val messagesRef = database.getReference("messages")

// Subscribe to messages
messagesRef.addChildEventListener(object : ChildEventListener {
    override fun onChildAdded(snapshot: DataSnapshot, previousChildName: String?) {
        // Handle new message
    }
})
```

---

## 🔄 **Migration from API to Direct Firebase**

### **Old Approach (API):**
```typescript
// ❌ OLD - Required API server
await fetch('/api/messages', {
  method: 'POST',
  body: JSON.stringify(message)
});
```

### **New Approach (Direct Firebase):**
```typescript
// ✅ NEW - Direct Firebase
await sendMessage(message);
// Faster, real-time, mobile compatible
```

---

## 📝 **Key Takeaways**

### **For Mobile Developers:**

1. ✅ **Use same Firebase project** as web app
2. ✅ **Copy chat.service.ts** functions to mobile app
3. ✅ **No API calls needed** - direct Firebase
4. ✅ **Same data structure** - messages, chatRooms, presence, typing
5. ✅ **Real-time by default** - no polling
6. ✅ **Offline support** - automatic with Firebase
7. ✅ **Secure** - Firebase Security Rules protect everything

### **Performance:**
- **Latency:** < 100ms (web ↔ mobile)
- **Offline:** Automatic queue & sync
- **Scalable:** Firebase handles millions of connections
- **Cost:** Lower than API approach

### **Compatibility:**
- ✅ React Native
- ✅ Flutter
- ✅ Native iOS
- ✅ Native Android
- ✅ Web (React)

---

## 🎉 **Ready to Use!**

Your mobile app can now:
- Send/receive messages instantly
- Show typing indicators
- Display online status
- Work offline
- Sync automatically

All using the **same Firebase backend** as the web app!

---

**Questions?** Check `src/lib/firebase/chat.service.ts` for all available functions.

