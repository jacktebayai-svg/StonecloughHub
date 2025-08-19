# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development
```bash
# Start development server (full stack)
npm run dev

# Type checking
npm run check

# Build for production
npm run build

# Start production server
npm start
```

### Database Operations
```bash
# Push database schema changes (development)
npm run db:push

# Run database migrations
npm run db:migrate

# Seed database with initial data
npm run db:seed
```

### Web Scraper Operations
```bash
# Build scraper for deployment
npm run scraper:build

# Run scraper in development
npm run scraper:dev

# Run production scraper
npm run scraper:start
```

### Deployment & Docker
```bash
# Build for Vercel deployment
npm run vercel-build

# Build for Railway deployment
npm run railway:build

# Build Docker containers
npm run docker:build
npm run docker:build-scraper

# Run with Docker
npm run docker:run
npm run docker:run-scraper
```

### Running Single Tests
```bash
# Type check specific files
npx tsc --noEmit [file-path]

# Test scraper quality
node scripts/test-railway-deployment.js
```

## Architecture Overview

### Full-Stack TypeScript Application
StonecloughHub is a comprehensive community platform built as a full-stack TypeScript application with:

- **Frontend**: React 18 + Vite + Tailwind CSS client-side application
- **Backend**: Express.js server with PostgreSQL via Drizzle ORM
- **Authentication**: Supabase Auth replacing legacy Passport.js system
- **Database**: PostgreSQL with Supabase as the managed database provider

### Project Structure Pattern
```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components (Radix UI + shadcn/ui)
│   │   ├── pages/         # Route-level page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Client-side utilities
│   │   └── contexts/      # React contexts (primarily AuthContext)
├── server/                # Express.js backend
│   ├── routes/           # API route handlers and auth routes
│   ├── services/         # Business logic and data services
│   ├── database/         # Database schema and migrations
│   └── *.ts files        # Server utilities (storage, auth, db config)
├── shared/               # Shared TypeScript schemas and types
├── scripts/              # Database and deployment automation scripts
└── api/                  # Serverless route handlers (Vercel compatibility)
```

### Key Architecture Patterns

#### Data Layer Architecture
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Storage Interface**: Abstract `IStorage` interface in `server/storage.ts` with comprehensive CRUD operations
- **Schema-First**: Shared TypeScript schemas in `shared/schema.ts` using Zod for validation
- **Database Tables**: Users, profiles, businesses, forum discussions, blog articles, surveys, council data

#### Authentication Architecture
- **Supabase Auth**: Modern authentication replacing legacy Passport.js
- **JWT Tokens**: Server-side token validation with Supabase client
- **Row Level Security**: Database-level security policies for data protection
- **Role-Based Access**: User, moderator, and admin roles with middleware protection

#### API Design Pattern
- **RESTful Routes**: Conventional REST endpoints in `server/routes.ts`
- **Middleware Stack**: Authentication, authorization, and logging middleware
- **Error Handling**: Centralized error handling with structured JSON responses
- **Type Safety**: Request/response validation using Zod schemas

#### Frontend State Management
- **React Query**: Data fetching, caching, and synchronization
- **Context API**: Authentication state management via `AuthContext`
- **Wouter Router**: Lightweight client-side routing
- **Component Libraries**: Radix UI primitives with shadcn/ui styling

### Specialized Features

#### Web Scraping System
Advanced multi-layered scraping architecture for Bolton Council data:
- **Intelligent Crawler**: AI-powered content analysis and priority scheduling
- **Advanced Data Extraction**: Multi-format parsing with semantic analysis
- **Enhanced Storage**: Deduplication and quality scoring
- **Monitoring System**: Performance metrics and error tracking

#### Community Platform Features
- **Business Directory**: Categorized local business listings with verification
- **Forum System**: Categorized discussions with replies and engagement metrics
- **Blog Platform**: Content management with featured articles and promotion
- **Surveys & Polls**: Dynamic question builders with response analytics
- **Council Data Integration**: Real-time integration of planning applications, meetings, and spending data

### Development Guidelines

#### Database Development
- Use `npm run db:migrate` for schema changes, not direct SQL
- Always use type-safe Drizzle queries instead of raw SQL
- Database seeding runs automatically on startup if no data exists
- Supabase provides both connection pooling and direct connections

#### Authentication Implementation
- Use `isAuthenticated` middleware for protected routes
- Role checking with `isAdmin` and `isModerator` middleware
- Client-side auth state managed through `useAuth` hook
- Supabase handles token refresh automatically

#### Component Development
- Follow shadcn/ui patterns for new components
- Use Radix UI primitives for accessible base components
- Tailwind CSS for styling with consistent design tokens
- Framer Motion for animations where appropriate

#### API Development
- Validate requests using Zod schemas from `shared/schema.ts`
- Use storage interface methods instead of direct database access
- Implement proper error handling with structured responses
- Include request logging for API debugging

### Environment Configuration

#### Required Environment Variables
```bash
# Database (Supabase)
DATABASE_URL=postgresql://...

# Supabase Authentication
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_KEY=[service-key]
VITE_SUPABASE_URL=[same-as-above]
VITE_SUPABASE_ANON_KEY=[same-as-above]

# Application
NODE_ENV=development|production
PORT=5000
APP_URL=http://localhost:5000
```

#### Development vs Production
- Development: Uses Vite dev server proxy for API routes
- Production: Express serves both API and static client files
- Database migrations should be run before deployment
- Scraping functionality can be disabled in development

### Integration Points

#### Supabase Integration
- Authentication handled entirely by Supabase Auth
- Database hosted on Supabase with automatic backups
- Row Level Security policies protect user data
- Real-time subscriptions available but not currently implemented

#### Deployment Integration
- **Vercel**: Primary deployment target with serverless functions
- **Railway**: Alternative deployment with persistent containers
- **Docker**: Containerized deployment with separate app and scraper containers
- **GitHub Actions**: Automated deployment pipeline (configured but not active)

### Data Models Understanding

#### Core Entities
- **Users**: Authentication and basic profile information
- **Profiles**: Extended user information and preferences
- **Businesses**: Local business directory entries with categorization
- **Forum**: Discussion threads and replies with engagement tracking
- **Blog**: Content management with featured articles and categories
- **Surveys**: Dynamic survey creation with response analytics
- **Council Data**: Scraped government data with type classification

#### Relationships
- Users have one Profile (one-to-one)
- Users can create multiple Businesses (one-to-many)
- Forum Discussions have many Replies (one-to-many)
- Surveys have many Survey Responses (one-to-many)
- Skills and Users have many-to-many relationship through UserSkills

This architecture enables rapid development of community platform features while maintaining type safety, scalability, and modern development practices.
