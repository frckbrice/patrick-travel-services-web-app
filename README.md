# Patrick Travel Services - Web Application

A production-ready immigration services management platform built with modern web technologies. Full-stack application featuring real-time communication, document management, and comprehensive case tracking for immigration consulting services.

## Technology Stack

### Frontend
- **Framework:** Next.js 15 (App Router) with React 19
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui (Radix UI primitives)
- **State Management:** Zustand for global state, TanStack Query for server state
- **Data Tables:** TanStack Table v8 with server-side operations
- **Forms:** React Hook Form with Zod validation
- **Charts:** Recharts for analytics visualization
- **Real-time:** Firebase Realtime Database for messaging

### Backend
- **API:** Next.js API Routes (RESTful)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Firebase Auth with role-based access control
- **File Storage:** UploadThing and Cloudinary
- **Email:** Nodemailer with template system

### Development & Quality
- **Code Quality:** ESLint 9, Prettier, TypeScript strict mode
- **Git Workflow:** Husky hooks, lint-staged, Conventional Commits
- **CI/CD:** GitHub Actions with Docker builds
- **Testing:** Type checking and build validation
- **Package Manager:** pnpm

## Architecture Highlights

### Modern React Patterns
- Server and Client Components separation
- React Suspense for code splitting and loading states
- Error boundaries for graceful error handling
- Progressive Web App (PWA) with offline support
- Optimized font loading and image optimization

### Performance Optimizations
- Next.js App Router with streaming SSR
- React Query for intelligent caching and data synchronization
- Code splitting with dynamic imports
- Image optimization with AVIF/WebP formats
- Bundle size optimization with tree-shaking
- Service worker for offline functionality

### Security Features
- Firebase Authentication with ID token verification
- Role-based access control (RBAC) with custom claims
- Input validation with Zod schemas
- SQL injection prevention via Prisma ORM
- PII protection with HMAC-SHA256 hashing
- Security headers and CORS configuration

### Code Quality Standards
- TypeScript strict mode for type safety
- Feature-based folder structure
- Component composition and reusability
- Consistent error handling patterns
- Centralized API response utilities
- Comprehensive logging system

## Key Features

- **Case Management:** Complete lifecycle tracking with status management, document verification, and agent assignment
- **Client Management:** Comprehensive profiles with case history and communication tracking
- **Real-time Messaging:** Firebase-powered chat with presence indicators and file attachments
- **Document Management:** Secure upload, verification workflow, and template library
- **Analytics Dashboard:** Performance metrics, revenue tracking, and visual reporting
- **Multi-language Support:** i18next integration for internationalization
- **Audit Logging:** Compliance-ready activity tracking

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── (auth)/            # Authentication routes
│   ├── (public)/          # Public-facing pages
│   ├── dashboard/         # Protected dashboard routes
│   └── api/               # API route handlers
├── components/            # Reusable UI components
│   ├── ui/                # shadcn/ui components
│   └── layout/            # Layout components
├── features/              # Feature-based modules
│   ├── auth/              # Authentication feature
│   ├── cases/              # Case management feature
│   ├── documents/          # Document management feature
│   └── messages/           # Messaging feature
├── lib/                   # Utility libraries and helpers
│   ├── db/                # Database utilities (Prisma)
│   ├── firebase/          # Firebase integration
│   └── utils/             # Helper functions
└── hooks/                 # Custom React hooks
```

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- pnpm 8.x or higher
- PostgreSQL 14.x or higher
- Firebase project with Realtime Database

### Installation

```bash
# Clone repository
git clone <repository-url>
cd mpe-digital-project-1/web

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Configure DATABASE_URL, Firebase credentials, and other required variables

# Generate Prisma Client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate

# Start development server
pnpm dev
```

Visit `http://localhost:3000` to view the application.

## Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier
pnpm type-check       # Run TypeScript type checking
pnpm validate         # Run all quality checks and build
```

## Database

The application uses PostgreSQL with Prisma ORM. Key entities include Users, Cases, Documents, Messages, and AuditLogs. See `prisma/schema.prisma` for the complete schema.

## Deployment

### Docker
```bash
docker-compose up -d
```

### Vercel
The application is optimized for Vercel deployment with automatic builds and environment variable configuration.

## API Design

RESTful API endpoints with consistent response patterns:
- Authentication: `/api/auth/*`
- Cases: `/api/cases/*`
- Documents: `/api/documents/*`
- Messages: `/api/messages/*`
- Users: `/api/users/*`

All endpoints are protected with Firebase token verification and role-based authorization.

## Best Practices

- Type safety with TypeScript strict mode
- Component-based architecture with feature modules
- Server and client component separation
- Optimistic UI updates with React Query
- Error boundaries and loading states
- Accessibility compliance (WCAG 2.1)
- Mobile-first responsive design
- Performance monitoring with Web Vitals

## License

MIT
