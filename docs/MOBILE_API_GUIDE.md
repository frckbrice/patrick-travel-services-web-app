# Mobile App API Integration Guide

Complete API documentation for mobile app developers integrating with Patrick Travel Services backend.

## 🔐 Authentication Flow

### 1. User Registration

```javascript
// Step 1: Call our registration endpoint
const response = await fetch('https://your-api.com/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    inviteCode: 'INVITE123', // Optional
    acceptedTerms: true,
    acceptedPrivacy: true,
    consentedAt: new Date().toISOString()
  })
});

const data = await response.json();
// Returns: { success: true, data: { user, customToken }, message: "..." }
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
    "customToken": "firebase-custom-token-here"
  }
}
```

### 2. User Login

```javascript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Step 1: Authenticate with Firebase
const auth = getAuth();
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const idToken = await userCredential.user.getIdToken();

// Step 2: Sync with our backend (optional but recommended)
const response = await fetch('https://your-api.com/api/auth/login', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}` // Preferred
  },
  // OR send in body for easier mobile integration:
  body: JSON.stringify({ idToken })
});

const data = await response.json();
// Returns: { success: true, data: { user }, message: "Login successful" }
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
      "phone": "+1234567890",
      "role": "CLIENT",
      "isActive": true,
      "isVerified": true,
      "lastLogin": "2025-10-20T08:00:00.000Z",
      "createdAt": "2025-10-19T10:00:00.000Z",
      "updatedAt": "2025-10-20T08:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2025-10-20T08:00:00.000Z"
  }
}
```

### 3. Get Current User

```javascript
const idToken = await auth.currentUser.getIdToken();

const response = await fetch('https://your-api.com/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});
```

---

## 📊 Dashboard Statistics (Single Endpoint)

### Get All Dashboard Stats

**Optimized for mobile - returns everything in one call!**

```javascript
const idToken = await auth.currentUser.getIdToken();

const response = await fetch('https://your-api.com/api/users/dashboard-stats', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});

const { data } = await response.json();
```

**Response:**
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "user": {
      "id": "user-id",
      "role": "CLIENT"
    },
    "cases": {
      "total": 5,
      "active": 3,
      "completed": 2,
      "rejected": 0,
      "byStatus": {
        "SUBMITTED": 1,
        "UNDER_REVIEW": 2,
        "APPROVED": 2
      },
      "byPriority": {
        "NORMAL": 3,
        "HIGH": 2
      },
      "byServiceType": {
        "STUDENT_VISA": 2,
        "WORK_PERMIT": 3
      }
    },
    "documents": {
      "total": 12,
      "pending": 3,
      "approved": 8,
      "rejected": 1,
      "byType": {
        "PASSPORT": 1,
        "DIPLOMA": 2,
        "BANK_STATEMENT": 3
      }
    },
    "notifications": {
      "unread": 5
    },
    "recent": {
      "cases": [
        {
          "id": "case-id",
          "caseNumber": "CASE-2024-001",
          "serviceType": "STUDENT_VISA",
          "status": "UNDER_REVIEW",
          "priority": "HIGH",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "updatedAt": "2024-01-15T10:30:00.000Z",
          "client": {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com"
          },
          "assignedAgent": {
            "firstName": "Jane",
            "lastName": "Smith",
            "email": "jane@agency.com"
          }
        }
      ],
      "documents": [
        {
          "id": "doc-id",
          "fileName": "passport.pdf",
          "documentType": "PASSPORT",
          "status": "APPROVED",
          "fileSize": 1024000,
          "createdAt": "2024-01-10T00:00:00.000Z",
          "case": {
            "caseNumber": "CASE-2024-001",
            "serviceType": "STUDENT_VISA"
          }
        }
      ]
    }
  },
  "meta": {
    "timestamp": "2025-10-20T08:00:00.000Z"
  }
}
```

**Use this data to:**
- Display stat cards (total cases, active cases, pending documents, unread notifications)
- Show recent activity feed
- Build charts by status/priority/service type

---

## 📁 Individual Endpoints (Alternative)

If you prefer granular control, use these endpoints:

### Cases

```javascript
// Get all cases
GET /api/cases
GET /api/cases?status=UNDER_REVIEW&page=1&limit=20

// Get single case
GET /api/cases/{caseId}

// Create case (CLIENT only)
POST /api/cases
Body: {
  "serviceType": "STUDENT_VISA",
  "description": "...",
  "priority": "NORMAL"
}
```

### Documents

```javascript
// Get all documents
GET /api/documents
GET /api/documents?caseId={caseId}&page=1&limit=20

// Get single document
GET /api/documents/{documentId}
```

### Notifications

```javascript
// Get all notifications
GET /api/notifications
GET /api/notifications?status=unread&page=1&limit=20

// Mark all as read
POST /api/notifications/mark-all-read

// Mark single as read
PATCH /api/notifications/{notificationId}
```

### Messages/Chat

```javascript
// Get chat history
GET /api/chat/history?chatRoomId={roomId}&limit=50

// Search messages
GET /api/chat/search?query=visa&chatRoomId={roomId}
```

### User Profile

```javascript
// Get user profile
GET /api/users/{userId}

// Update user profile
PUT /api/users/profile
Body: {
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}

// Get user settings
GET /api/users/settings

// Update settings
PUT /api/users/settings
Body: {
  "emailNotifications": true,
  "pushNotifications": true,
  "smsNotifications": false
}
```

### Push Notifications

```javascript
// Register device for push notifications
POST /api/users/push-token
Body: {
  "pushToken": "ExponentPushToken[...]",
  "platform": "ios" | "android"
}
```

---

## 📝 FAQs (Public - No Auth)

```javascript
// Get all FAQs
GET /api/faq
GET /api/faq?category=Visa%20Process&search=student

// Response
{
  "success": true,
  "data": {
    "faqs": [...],
    "categories": ["Visa Process", "Documents", "Payment", "Account", "General"]
  }
}
```

---

## 🚨 Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "User-friendly error message",
  "errors": {
    "email": ["Invalid email format"],
    "password": ["Password too weak"]
  },
  "meta": {
    "timestamp": "2025-10-20T08:00:00.000Z"
  }
}
```

**Common Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate email, etc.)
- `429` - Too Many Requests (rate limited)
- `500` - Server Error

---

## 🔑 Authentication Headers

**All authenticated endpoints require:**
```javascript
headers: {
  'Authorization': `Bearer ${firebaseIdToken}`,
  'Content-Type': 'application/json'
}
```

**How to get Firebase ID token:**
```javascript
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;

if (user) {
  const idToken = await user.getIdToken();
  // Use this token in Authorization header
}
```

**Token automatically refreshes** - Firebase SDK handles this. Just call `getIdToken()` before each request.

---

## 📱 Recommended Mobile Implementation

```javascript
// 1. Create API client utility
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.auth = getAuth();
  }

  async getIdToken() {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return await user.getIdToken();
  }

  async request(endpoint, options = {}) {
    const idToken = await this.getIdToken();
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data.data;
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/api/users/dashboard-stats');
  }

  // Cases
  async getCases(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/cases?${params}`);
  }

  async getCase(caseId) {
    return this.request(`/api/cases/${caseId}`);
  }

  // Documents
  async getDocuments(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/documents?${params}`);
  }

  // Notifications
  async getNotifications(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/notifications?${params}`);
  }

  async markAllNotificationsRead() {
    return this.request('/api/notifications/mark-all-read', { method: 'POST' });
  }
}

// Usage in React Native
const api = new ApiClient('https://your-api.vercel.app');

// In your dashboard screen
const stats = await api.getDashboardStats();
console.log('Total cases:', stats.cases.total);
console.log('Unread notifications:', stats.notifications.unread);
```

---

## 🎯 Quick Start for Mobile

### After Login:
```javascript
// 1. Get dashboard overview
const stats = await fetch('/api/users/dashboard-stats', {
  headers: { 'Authorization': `Bearer ${idToken}` }
});

// 2. Register for push notifications
await fetch('/api/users/push-token', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    pushToken: expoPushToken,
    platform: Platform.OS // 'ios' or 'android'
  })
});

// 3. Use stats to populate dashboard
const { cases, documents, notifications } = stats.data;
```

---

## 📊 Dashboard Stats Response Structure

```typescript
interface DashboardStatsResponse {
  user: {
    id: string;
    role: 'CLIENT' | 'AGENT' | 'ADMIN';
  };
  cases: {
    total: number;
    active: number;
    completed: number;
    rejected: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byServiceType: Record<string, number>;
  };
  documents: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byType: Record<string, number>;
  };
  notifications: {
    unread: number;
  };
  recent: {
    cases: Case[];
    documents: Document[];
  };
}
```

---

## 🔄 Real-time Updates (Optional)

For real-time notifications and messages, use Firebase Realtime Database:

```javascript
import { getDatabase, ref, onValue } from 'firebase/database';

const db = getDatabase();

// Listen to notifications
const notificationsRef = ref(db, `notifications/${userId}`);
onValue(notificationsRef, (snapshot) => {
  const notifications = snapshot.val();
  // Update UI
});

// Listen to chat messages
const chatRef = ref(db, `chatRooms/${roomId}/messages`);
onValue(chatRef, (snapshot) => {
  const messages = snapshot.val();
  // Update UI
});
```

---

## 🛡️ Security Notes

1. **Never store passwords** - Only store Firebase ID tokens temporarily
2. **Tokens auto-refresh** - Firebase SDK handles this
3. **All errors are sanitized** - No database/internal info exposed
4. **PII is protected** - Server logs hash sensitive data
5. **Rate limiting applied** - Prevents abuse

---

## 🚀 Performance Tips

1. **Cache dashboard stats** - Refresh every 30-60 seconds
2. **Use pagination** - Don't load all data at once
3. **Lazy load documents** - Only fetch when user views documents tab
4. **Optimistic updates** - Update UI immediately, sync with server
5. **Offline support** - Cache critical data locally

---

## 📞 Support

For API issues or questions:
- Check error responses for specific guidance
- All errors include `meta.timestamp` for debugging
- Contact backend team with error details

---

## 🔗 Base URLs

- **Production**: `https://web-l6wp284u3-frckbrices-projects.vercel.app`
- **Development**: `http://localhost:3000`

---

## ✅ Endpoint Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/register` | POST | ❌ No | Register new user |
| `/api/auth/login` | POST | ✅ Firebase | Sync login, refresh claims |
| `/api/auth/me` | GET | ✅ Yes | Get current user |
| `/api/users/dashboard-stats` | GET | ✅ Yes | **All dashboard data** |
| `/api/cases` | GET | ✅ Yes | List user's cases |
| `/api/cases/{id}` | GET | ✅ Yes | Case details |
| `/api/documents` | GET | ✅ Yes | List user's documents |
| `/api/notifications` | GET | ✅ Yes | User notifications |
| `/api/notifications/mark-all-read` | POST | ✅ Yes | Mark all read |
| `/api/users/push-token` | POST | ✅ Yes | Register push token |
| `/api/users/settings` | GET | ✅ Yes | Get user settings |
| `/api/users/settings` | PUT | ✅ Yes | Update settings |
| `/api/faq` | GET | ❌ No | Get FAQs (public) |
| `/api/health` | GET | ❌ No | Health check |

---

**Last Updated:** October 20, 2025  
**API Version:** 1.0.0

