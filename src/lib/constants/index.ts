// Shared constants for Patrick Travel Services

export const API_CONFIG = {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
};

export const TOKEN_CONFIG = {
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
};

export const RATE_LIMIT = {
    AUTH_ENDPOINTS: {
        MAX_REQUESTS: 5,
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    },
    GENERAL_API: {
        MAX_REQUESTS: 100,
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    },
    FILE_UPLOAD: {
        MAX_REQUESTS: 10,
        WINDOW_MS: 60 * 60 * 1000, // 1 hour
    },
};

export const PASSWORD_CONFIG = {
    MIN_LENGTH: 8,
    BCRYPT_SALT_ROUNDS: 12,
    MAX_LOGIN_ATTEMPTS: 5,
};

export const FILE_UPLOAD = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB in bytes
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png',
    ],
};

export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
};

export const SERVICE_TYPE_LABELS = {
    STUDENT_VISA: 'Student Visa',
    WORK_PERMIT: 'Work Permit',
    FAMILY_REUNIFICATION: 'Family Reunification',
    TOURIST_VISA: 'Tourist Visa',
    BUSINESS_VISA: 'Business Visa',
    PERMANENT_RESIDENCY: 'Permanent Residency',
};

export const CASE_STATUS_LABELS = {
    SUBMITTED: 'Submitted',
    UNDER_REVIEW: 'Under Review',
    DOCUMENTS_REQUIRED: 'Documents Required',
    PROCESSING: 'Processing',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    CLOSED: 'Closed',
};

export const PRIORITY_LABELS = {
    LOW: 'Low',
    NORMAL: 'Normal',
    HIGH: 'High',
    URGENT: 'Urgent',
};

export const DOCUMENT_TYPE_LABELS = {
    PASSPORT: 'Passport',
    ID_CARD: 'ID Card',
    BIRTH_CERTIFICATE: 'Birth Certificate',
    MARRIAGE_CERTIFICATE: 'Marriage Certificate',
    DIPLOMA: 'Diploma',
    EMPLOYMENT_LETTER: 'Employment Letter',
    BANK_STATEMENT: 'Bank Statement',
    PROOF_OF_RESIDENCE: 'Proof of Residence',
    PHOTO: 'Photo',
    OTHER: 'Other',
};

export const DOCUMENT_STATUS_LABELS = {
    PENDING: 'Pending Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
};

export const NOTIFICATION_TYPE_LABELS = {
    CASE_STATUS_UPDATE: 'Case Status Update',
    NEW_MESSAGE: 'New Message',
    DOCUMENT_UPLOADED: 'Document Uploaded',
    DOCUMENT_VERIFIED: 'Document Verified',
    DOCUMENT_REJECTED: 'Document Rejected',
    CASE_ASSIGNED: 'Case Assigned',
    SYSTEM_ANNOUNCEMENT: 'System Announcement',
};

export const ROLE_LABELS = {
    CLIENT: 'Client',
    AGENT: 'Agent',
    ADMIN: 'Administrator',
};

export const DATA_RETENTION = {
    ACTIVE_CASES: 365, // days
    COMPLETED_CASES: 5 * 365, // 5 years in days
    INACTIVE_ACCOUNTS: 2 * 365, // 2 years in days
};

export const ERROR_MESSAGES = {
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'You do not have permission to perform this action',
    NOT_FOUND: 'Resource not found',
    VALIDATION_ERROR: 'Validation error',
    SERVER_ERROR: 'Internal server error',
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_ALREADY_EXISTS: 'Email already exists',
    ACCOUNT_NOT_VERIFIED: 'Account not verified. Please check your email',
    ACCOUNT_INACTIVE: 'Account is inactive',
    INVALID_TOKEN: 'Invalid or expired token',
    FILE_TOO_LARGE: 'File size exceeds the maximum limit',
    INVALID_FILE_TYPE: 'Invalid file type',
    CASE_NOT_FOUND: 'Case not found',
    DOCUMENT_NOT_FOUND: 'Document not found',
};

export const SUCCESS_MESSAGES = {
    REGISTRATION_SUCCESS: 'Registration successful. Please check your email to verify your account',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    PASSWORD_RESET_EMAIL_SENT: 'Password reset email sent',
    PASSWORD_RESET_SUCCESS: 'Password reset successful',
    PROFILE_UPDATED: 'Profile updated successfully',
    CASE_SUBMITTED: 'Case submitted successfully',
    CASE_UPDATED: 'Case updated successfully',
    DOCUMENT_UPLOADED: 'Document uploaded successfully',
    DOCUMENT_DELETED: 'Document deleted successfully',
    MESSAGE_SENT: 'Message sent successfully',
    NOTIFICATION_READ: 'Notification marked as read',
};

export const ROUTES = {
    // Web Routes
    WEB: {
        HOME: '/',
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
        DASHBOARD: '/dashboard',
        CASES: '/cases',
        CASE_DETAILS: (id: string) => `/cases/${id}`,
        CLIENTS: '/clients',
        CLIENT_DETAILS: (id: string) => `/clients/${id}`,
        DOCUMENTS: '/documents',
        MESSAGES: '/messages',
        NOTIFICATIONS: '/notifications',
        PROFILE: '/profile',
        SETTINGS: '/settings',
        ANALYTICS: '/analytics',
        FAQ: '/faq',
        USERS: '/users',
        AUDIT_LOGS: '/audit-logs',
    },
    // Mobile Routes
    MOBILE: {
        SPLASH: '/',
        ONBOARDING: '/onboarding',
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        FORGOT_PASSWORD: '/auth/forgot-password',
        HOME: '/home',
        CASES: '/cases',
        CASE_DETAILS: (id: string) => `/cases/${id}`,
        NEW_CASE: '/cases/new',
        DOCUMENTS: '/documents',
        MESSAGES: '/messages',
        NOTIFICATIONS: '/notifications',
        PROFILE: '/profile',
        HELP: '/help',
    },
    // API Routes
    API: {
        AUTH: {
            REGISTER: '/api/auth/register',
            LOGIN: '/api/auth/login',
            LOGOUT: '/api/auth/logout',
            REFRESH_TOKEN: '/api/auth/refresh-token',
            VERIFY_EMAIL: '/api/auth/verify-email',
            RESEND_VERIFICATION: '/api/auth/resend-verification',
            FORGOT_PASSWORD: '/api/auth/forgot-password',
            RESET_PASSWORD: '/api/auth/reset-password',
            ME: '/api/auth/me',
        },
        USERS: {
            PROFILE: '/api/users/profile',
            PASSWORD: '/api/users/password',
            ACCOUNT: '/api/users/account',
            DATA_EXPORT: '/api/users/data-export',
        },
        ADMIN: {
            USERS: '/api/admin/users',
            USER_DETAILS: (id: string) => `/api/admin/users/${id}`,
            USER_ACTIVITY: (id: string) => `/api/admin/users/${id}/activity`,
            CASES: '/api/admin/cases',
            CASE_DETAILS: (id: string) => `/api/admin/cases/${id}`,
            CASE_STATUS: (id: string) => `/api/admin/cases/${id}/status`,
            CASE_ASSIGN: (id: string) => `/api/admin/cases/${id}/assign`,
            CASE_NOTES: (id: string) => `/api/admin/cases/${id}/notes`,
            CASE_PRIORITY: (id: string) => `/api/admin/cases/${id}/priority`,
            CASE_HISTORY: (id: string) => `/api/admin/cases/${id}/history`,
            DOCUMENTS: '/api/admin/documents',
            DOCUMENT_VERIFY: (id: string) => `/api/admin/documents/${id}/verify`,
            DOCUMENT_REJECT: (id: string) => `/api/admin/documents/${id}/reject`,
            STATISTICS: {
                OVERVIEW: '/api/admin/statistics/overview',
                CASES_BY_STATUS: '/api/admin/statistics/cases-by-status',
                CASES_BY_SERVICE: '/api/admin/statistics/cases-by-service',
                CASES_TREND: '/api/admin/statistics/cases-trend',
                AGENT_PERFORMANCE: '/api/admin/statistics/agent-performance',
                CUSTOM_REPORT: '/api/admin/statistics/custom-report',
            },
            FAQ: '/api/admin/faq',
            FAQ_DETAILS: (id: string) => `/api/admin/faq/${id}`,
            SETTINGS: '/api/admin/settings',
            SETTING_DETAILS: (key: string) => `/api/admin/settings/${key}`,
            ACTIVITY_LOGS: '/api/admin/activity-logs',
            ACTIVITY_LOGS_EXPORT: '/api/admin/activity-logs/export',
        },
        CASES: '/api/cases',
        CASE_DETAILS: (id: string) => `/api/cases/${id}`,
        CASE_DOCUMENTS: (caseId: string) => `/api/cases/${caseId}/documents`,
        CASE_MESSAGES: (caseId: string) => `/api/cases/${caseId}/messages`,
        DOCUMENTS: '/api/documents',
        DOCUMENT_DOWNLOAD: (id: string) => `/api/documents/${id}/download`,
        MESSAGES: '/api/messages',
        MESSAGE_DETAILS: (id: string) => `/api/messages/${id}`,
        MESSAGE_READ: (id: string) => `/api/messages/${id}/read`,
        NOTIFICATIONS: '/api/notifications',
        NOTIFICATION_UNREAD_COUNT: '/api/notifications/unread-count',
        NOTIFICATION_READ: (id: string) => `/api/notifications/${id}/read`,
        NOTIFICATIONS_READ_ALL: '/api/notifications/read-all',
        FAQ: '/api/faq',
        FAQ_CATEGORIES: '/api/faq/categories',
        CONTACT: '/api/contact',
        HEALTH: '/api/health',
    },
};

