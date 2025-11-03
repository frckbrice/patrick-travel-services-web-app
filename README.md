# Patrick Travel Services - Web Application

A production-ready immigration services management platform built with Next.js 15, designed to streamline case management, client communications, and administrative operations for immigration consulting services.

## Features


### Authentication & Authorization

- **Firebase Authentication** for secure user management
- Role-based access control (Admin, Agent, Client)
- Password reset and email verification
- Automatic token refresh via Firebase SDK
- Works seamlessly with both web and mobile clients

### Case Management

- Complete case lifecycle management
- Real-time case status tracking
- Document verification and management
- Case assignment to agents
- Internal notes and comments
- Case analytics and reporting

### Client Management

- Comprehensive client profiles
- Case history tracking
- Document management
- Communication history
- Client analytics

### Document Management

- Secure document upload and storage
- Document verification workflow
- User-friendly case selection (shows reference numbers, not IDs)
- Version control

### Communication

- Real-time chat (Firebase Realtime Database)
- Email messaging with case-based routing
- Presence tracking & typing indicators
- Email tracking & history in PostgreSQL

### Resources & Templates

- Downloadable document templates (forms, guides, checklists)
- Grouped by service type and category
- Admin template management
- Download tracking analytics
- Required document indicators

### Messaging System

- Real-time messaging with Firebase
- Agent-client communication
- File attachments support
- Message notifications
- Conversation history

### Analytics Dashboard

- Case statistics and metrics
- Revenue tracking
- Agent performance metrics
- Client acquisition analytics
- Visual charts and reports (Recharts)

### Additional Features

- **Invite Code System** - Secure staff onboarding with TanStack Table UI
  - Server-side pagination, filtering, and sorting
  - Role-based code generation (AGENT/ADMIN)
  - Usage tracking and expiration management
  - 8-column table with progress bars and status badges
- Audit logging for compliance
- FAQ management
- Notification system
- User profile management
- Settings and preferences

## Tech Stack

### Frontend

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui
- **Data Tables:** TanStack Table v8 (Invite Codes, Users, Clients, Documents, FAQ, Audit Logs)
- **State Management:** Zustand + React Context API
- **Data Fetching:** TanStack Query (React Query)
- **Caching:** Native Map() + React Query (zero dependencies, 0KB bundle cost)
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **Notifications:** Sonner (shadcn)
- **File Upload:** React Dropzone
- **Date Handling:** date-fns
- **HTTP Client:** Axios with interceptors

### Backend

- **API:** Next.js API Routes
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Firebase Auth (no custom JWT needed)
- **Real-time:** Firebase Realtime Database (Chat/Messaging)
- **File Upload:** UploadThing (web) + Cloudinary (mobile uploads)

### Development Tools

- **Code Quality:** ESLint 9, Prettier
- **Git Hooks:** Husky, lint-staged
- **Commit Convention:** Commitlint (Conventional Commits)
- **Type Checking:** TypeScript 5 (strict mode)
- **Package Manager:** pnpm (preferred)

## Why Firebase Auth?


We chose Firebase Authentication over custom JWT for several key reasons:

1. **Simplified Architecture** - No need to manage JWT secrets, token generation, or refresh logic
2. **Better Security** - Battle-tested authentication with automatic security updates
3. **Mobile & Web Compatibility** - Same auth flow works seamlessly across all platforms
4. **Advanced Features** - Email verification, password reset, MFA, and social login out-of-the-box
5. **Reduced Maintenance** - Firebase handles all password hashing, token management, and security


## Prerequisites


- Node.js 18.x or higher
- pnpm 8.x or higher (preferred) or yarn
- PostgreSQL 14.x or higher
- Firebase project with Realtime Database enabled (for real-time messaging)

## Getting Started


### 1. Clone the repository

```bash
git clone <repository-url>
cd mpe-digital-project-1/web
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Environment Setup

Create a `.env` file in the web directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/patrick_travel"


# Firebase Admin
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-client-email"
FIREBASE_PRIVATE_KEY="your-private-key"

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_DATABASE_URL="https://your-project-id.firebaseio.com"

# UploadThing (File Upload Service)
# Get your token from https://uploadthing.com/dashboard
UPLOADTHING_TOKEN="your-uploadthing-token"

# Cloudinary (Mobile uploads – optional)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# PII Hash Secret (REQUIRED for secure logging)
# Generate with: openssl rand -hex 32
PII_HASH_SECRET="your-random-secret-here"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup

```bash
# Generate Prisma Client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# (Optional) Open Prisma Studio to view database
pnpm prisma:studio
```

### 5. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Setup (Alternative)


You can run the entire application stack using Docker and Docker Compose.

### Prerequisites for Docker

- Docker Engine 20.10+
- Docker Compose v2.0+

### Quick Start with Docker

1. **Clone and navigate to the project**

```bash
git clone <repository-url>
cd mpe-digital-project-1/web
```

2. **Copy environment file**

```bash
cp .env.example .env
```

Edit `.env` and configure your environment variables.

3. **Start all services**

```bash
docker-compose up -d
```

This will start:

- PostgreSQL database (port 5432)
- Next.js web application (port 3000)
- PgAdmin (port 5050) - Optional, use `docker-compose --profile tools up -d`

4. **Run database migrations**

```bash
docker-compose exec web pnpm prisma:migrate
```

5. **View logs**

```bash
docker-compose logs -f web
```

6. **Stop all services**

```bash
docker-compose down
```

### Docker Commands

```bash
# Build and start services
docker-compose up -d

# Rebuild images
docker-compose up -d --build

# Stop services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v

# View logs
docker-compose logs -f

# Execute commands in container
docker-compose exec web pnpm prisma:studio

# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d patrick_travel
```

### Production Docker Build

```bash
# Build production image
docker build -t patrick-travel-web:latest .

# Run production container
docker run -p 3000:3000 \
  --env-file .env \
  patrick-travel-web:latest

# Push to Docker Hub
docker tag patrick-travel-web:latest username/patrick-travel-web:latest
docker push username/patrick-travel-web:latest
```

### Docker Hub

The application is available on Docker Hub:

```bash
docker pull <docker-username>/patrick-travel-web:latest
```

## Available Scripts

### Development

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
```

### Code Quality

```bash
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint issues
pnpm format       # Format code with Prettier
pnpm format:check # Check code formatting
pnpm type-check   # Run TypeScript type checking
pnpm validate     # Run all quality checks + build
```

### Utilities

```bash
pnpm prisma:seed       # Seed database with initial data
pnpm test:email        # Send a test email
pnpm pwa:generate-icons # Regenerate PWA icons from logo
pnpm perf:optimize-images # Optimize images in public/
```

### Database

```bash
pnpm prisma:generate  # Generate Prisma Client
pnpm prisma:migrate   # Run database migrations
pnpm prisma:push      # Push schema changes to database
pnpm prisma:studio    # Open Prisma Studio
```

### Git Hooks

```bash
pnpm precommit    # Run pre-commit checks (lint-staged + type-check)
```

## Project Structure

```
web/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static assets
├── src/
│   ├── app/                   # Next.js app directory
│   │   ├── (auth)/           # Authentication pages
│   │   │   ├── login/        # Login page
│   │   │   ├── register/     # Registration page
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (dashboard)/      # Dashboard pages (protected)
│   │   │   ├── analytics/    # Analytics dashboard
│   │   │   ├── audit-logs/   # Audit logs
│   │   │   ├── cases/        # Case management
│   │   │   ├── clients/      # Client management
│   │   │   ├── dashboard/    # Main dashboard
│   │   │   ├── documents/    # Document management
│   │   │   ├── faq/          # FAQ management
│   │   │   ├── messages/     # Messaging system
│   │   │   ├── notifications/
│   │   │   ├── profile/      # User profile
│   │   │   ├── settings/     # Settings
│   │   │   └── users/        # User management
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── cases/        # Case CRUD operations
│   │   │   ├── documents/    # Document operations
│   │   │   ├── messages/     # Message operations
│   │   │   └── users/        # User operations
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   └── providers.tsx     # App providers
│   ├── components/           # Reusable components
│   │   ├── auth/            # Auth components
│   │   ├── layout/          # Layout components
│   │   └── ui/              # UI components (shadcn)
│   ├── features/            # Feature-based modules
│   │   ├── auth/            # Auth feature
│   │   │   ├── api/         # Auth API hooks
│   │   │   ├── components/  # Auth components
│   │   │   ├── hooks/       # Auth hooks
│   │   │   └── schemas/     # Auth validation schemas
│   │   ├── cases/           # Cases feature
│   │   ├── documents/       # Documents feature
│   │   ├── messages/        # Messages feature
│   │   └── users/           # Users feature
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries
│   │   ├── auth/           # Auth utilities
│   │   ├── constants/      # App constants
│   │   ├── db/             # Database utilities
│   │   ├── firebase/       # Firebase utilities
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Helper functions
│   └── stores/              # Zustand stores
│       ├── auth/           # Auth store
│       ├── case/           # Case store
│       └── notification/   # Notification store
├── .env                     # Environment variables
├── .gitignore              # Git ignore rules
├── .husky/                 # Git hooks
├── .prettierrc             # Prettier config
├── commitlint.config.js    # Commitlint config
├── components.json         # shadcn config
├── eslint.config.mjs       # ESLint config
├── next.config.ts          # Next.js configuration
├── package.json            # Dependencies
├── postcss.config.mjs      # PostCSS config
├── tailwind.config.ts      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration
```

## Authentication Flow

### Registration

1. Client calls Firebase `createUserWithEmailAndPassword`
2. Backend creates user in database via `/api/auth/register`
3. Firebase returns custom token for immediate login
4. Client exchanges custom token for ID token

### Login

1. Client calls Firebase `signInWithEmailAndPassword`
2. Firebase returns ID token (JWT managed by Firebase)
3. Client syncs with backend via `/api/auth/login`
4. ID token used for all subsequent API calls

### Protected API Calls

1. Client includes Firebase ID token in `Authorization` header
2. Backend middleware verifies token with Firebase Admin SDK
3. Custom claims (role, permissions) extracted from token
4. Request processed based on user's role

### Token Management

- **ID tokens** are short-lived (1 hour)
- **Firebase SDK** automatically refreshes tokens
- **No manual refresh logic needed** - it just works!

## Database Schema

The application uses PostgreSQL with Prisma ORM. Key entities include:

- **Users** - System users (clients, agents, admins)
- **Cases** - Immigration cases with status tracking
- **Documents** - Case-related documents
- **Messages** - Chat (Firebase Realtime DB) + Emails (PostgreSQL with tracking)
- **Notifications** - User notifications
- **AuditLogs** - System activity tracking for compliance

See `prisma/schema.prisma` for the complete schema.

## Firebase Integration

Firebase is used for real-time messaging functionality via the Realtime Database:

- **Realtime Database** - Message storage and real-time sync
- **Real-time listeners** - Instant message delivery
- **File attachments** - Support for document sharing
- **Read receipts** - Message status tracking

## UI Components

Built with [shadcn/ui](https://ui.shadcn.com/):

- Fully accessible components (ARIA compliant)
- Customizable with Tailwind CSS
- Dark mode support ready
- Consistent design system
- Pre-built form components

## Code Quality & Git Workflow

### Pre-commit Hooks (via Husky)

Automatically runs before each commit:

- ESLint checks and fixes
- Prettier formatting
- TypeScript type checking
- Staged files only (lint-staged)

### Commit Message Format

Following [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

Types: feat, fix, docs, style, refactor, test, chore

Examples:
feat(auth): add  reset functionality
fix(cases): resolve status update bug
docs(readme): update installation instructions
refactor(api): improve error handling
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Cases (CRUD)

- `GET /api/cases` - List all cases
- `POST /api/cases` - Create new case
- `GET /api/cases/[id]` - Get case details
- `PUT /api/cases/[id]` - Update case
- `DELETE /api/cases/[id]` - Delete case

### Templates

- `GET /api/templates` - List document templates
- `POST /api/templates` - Create template (admin only)
- `GET /api/templates/[id]` - Download template
- `DELETE /api/templates/[id]` - Delete template (admin only)

### Documents (CRUD)

- `GET /api/documents` - List documents
- `POST /api/documents` - Upload document
- `GET /api/documents/[id]` - Get document
- `DELETE /api/documents/[id]` - Delete document

### Users (CRUD - Admin only)

- `GET /api/users` - List users
- `GET /api/users/[id]` - Get user details
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### Messages

- `GET /api/messages` - List conversations
- `POST /api/messages` - Send message
- `GET /api/messages/[id]` - Get conversation

## CI/CD Pipeline

The project includes a comprehensive GitHub Actions workflow for continuous integration and deployment.

### Workflow Features

- **Code Quality Checks**
  - ESLint linting
  - Prettier formatting
  - TypeScript type checking

- **Build Verification**
  - Production build
  - Prisma client generation
  - Build artifact upload

- **Docker Integration**
  - Multi-platform builds (amd64, arm64)
  - Automated Docker Hub publishing
  - Layer caching for faster builds

- **Security Scanning**
  - Dependency vulnerability audits
  - Automated security checks

### Setting Up CI/CD

1. **Configure GitHub Secrets**

Go to your repository → Settings → Secrets and add:

```
DOCKER_USERNAME=your-docker-hub-username
DOCKER_PASSWORD=your-docker-hub-password
PRODUCTION_URL=https://your-production-url.com
```

2. **Workflow Triggers**

The CI/CD pipeline runs on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

3. **Docker Image Publishing**

On successful build to `main` branch:

- Docker image is built and pushed to Docker Hub
- Tagged with: `latest`, branch name, commit SHA
- Available at: `docker pull <username>/patrick-travel-web:latest`

### Manual Workflow Trigger

```bash
# Trigger workflow manually (if enabled)
gh workflow run ci-cd.yml
```

## Deployment

### Docker Deployment (Recommended)

Pull and run the pre-built Docker image:

```bash
# Pull the latest image
docker pull <docker-username>/patrick-travel-web:latest

# Run with environment variables
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name patrick-travel-web \
  <docker-username>/patrick-travel-web:latest

# Or use docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Vercel (Alternative)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Configure environment variables
4. Deploy automatically

## PWA

This project is a fully installable Progressive Web App with offline support and app shortcuts. See `README_PWA.md` and the `docs/` folder for details and troubleshooting.

### Manual Deployment

```bash
# Install dependencies
pnpm install

# Build the application
pnpm build

# Start production server
pnpm start
```

### Environment Variables for Production

Ensure all environment variables are properly set:

- Database connection string (DATABASE_URL)
- Firebase credentials (admin and client, including NEXT_PUBLIC_FIREBASE_DATABASE_URL)
- File storage credentials (UploadThing and/or Cloudinary)
- PII hashing secret (PII_HASH_SECRET)
- App URL (NEXT_PUBLIC_APP_URL)

## Security Features

- **Firebase Authentication** - Industry-standard security with automatic updates
- **Firebase ID Token Verification** - All API routes protected with Firebase Admin SDK
- **Role-based Access Control (RBAC)** - Custom claims for granular permissions
- **Protected API Routes** - Middleware validates Firebase tokens on every request
- **Input Validation** - Zod schemas for all API inputs
- **SQL Injection Prevention** - Prisma ORM with parameterized queries
- **XSS Protection** - Built-in Next.js security features
- **CORS Configuration** - Configurable for production
- **PII Protection** - HMAC-SHA256 hashing of sensitive data in logs (see [PII_PROTECTION_LOGGING.md](./docs/PII_PROTECTION_LOGGING.md))
- **Rate Limiting** - Recommended for production (not included)

## File Upload with UploadThing

UploadThing provides a simpler, more developer-friendly alternative to traditional cloud storage:

### Features

- **Simple Authentication** - Uses your existing Firebase auth
- **Type-safe** - Full TypeScript support
- **Generous Free Tier** - 2GB free storage
- **Fast Uploads** - Optimized infrastructure
- **Easy Integration** - Drop-in React components

### Upload Endpoints

1. **Image Uploader** - Profile pictures, case images (4MB max)
2. **Document Uploader** - PDFs, Word docs, images (16MB max)
3. **Message Attachments** - Chat file sharing (8MB max)

### Usage Example

```typescript
import { FileUploader } from '@/components/upload/FileUploader';

<FileUploader
    endpoint="documentUploader"
    onUploadComplete={(files) => {
        console.log('Uploaded:', files);
    }}
/>
```

See [UploadThing Documentation](https://docs.uploadthing.com) for more information.

## Best Practices

- **Type Safety:** Full TypeScript coverage
- **Code Quality:** ESLint + Prettier enforced
- **Git Workflow:** Conventional commits + Husky hooks
- **Component Architecture:** Feature-based organization
- **State Management:** Zustand for global state, React Query for server state
- **Error Handling:** Centralized error handling with custom logger
- **API Design:** RESTful conventions with consistent responses
- **UX Design:** User-friendly selectors (e.g., case selection shows reference numbers, not raw IDs)

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Make your changes
3. Commit using conventional commits (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.

## 👥 Support

For support and questions, please contact the me at https://maebrieporfolio.vercel.app.

---

\*_Built with ❤️ by Avom Brice _ check at https://maebrieporfolio.vercel.app
