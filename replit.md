# The Stoneclough Hub - Community Data Platform

## Overview

The Stoneclough Hub is a community-focused web platform designed to provide transparent access to local government data, business directory services, and community engagement tools. The application serves as a central hub for residents of Stoneclough to access council data from Bolton Council, discover local businesses, participate in forums, read community blogs, and engage with surveys.

The platform follows a data-driven approach, automatically scraping and presenting information from data.bolton.gov.uk under the Open Government Licence, while providing additional community features to foster local engagement and business growth.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library for accessible, customizable components
- **Styling**: Tailwind CSS with custom design system variables and Inter font family
- **Charts**: Chart.js for data visualization and community analytics

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **API Design**: RESTful API architecture with organized route handlers
- **Data Layer**: Storage abstraction pattern with interface-based design for testability
- **Error Handling**: Centralized error handling middleware with structured error responses
- **Development**: Vite for development server with HMR and build tooling

### Database Design
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Schema**: Well-structured relational design with:
  - Council data tracking (planning applications, spending, meetings)
  - Business directory with categorization and verification system
  - Community forum with threaded discussions
  - Blog system with featured content
  - Survey system with response tracking
- **Types**: Comprehensive enum definitions for data consistency
- **Validation**: Zod integration for runtime type validation

### Data Processing
- **Advanced Web Scraper**: Multi-layer deep crawling system capable of 7+ layers deep with 20+ files per layer
- **Intelligent URL Discovery**: Automatic link extraction and relevance filtering for comprehensive data collection
- **Retry Logic**: Exponential backoff and error handling for reliable data extraction
- **Data Pipeline**: Automated collection from Bolton Council planning portal and council websites
- **Content Management**: Structured metadata extraction and categorization with depth tracking

### Authentication & Authorization
- Session-based architecture prepared for user management
- Role-based access control considerations for business listings and content management

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Environment**: Requires DATABASE_URL for database connectivity

### Third-party APIs
- **Bolton Council Data**: Primary data source from data.bolton.gov.uk under Open Government Licence
- **Potential Integrations**: Framework ready for additional council APIs and external data sources

### Development & Deployment Tools
- **Replit Integration**: Custom plugins for development environment and error overlay
- **Build System**: Vite for frontend builds, esbuild for server-side bundling
- **Development**: Comprehensive TypeScript configuration with path mapping

### UI & Styling Dependencies
- **Component Libraries**: Extensive Radix UI ecosystem for accessible components
- **Styling**: Tailwind CSS with PostCSS processing
- **Icons**: Lucide React for consistent iconography
- **Typography**: Google Fonts (Inter) for modern typography

### Utility Libraries
- **Date Handling**: date-fns for date manipulation and formatting
- **Form Management**: React Hook Form with resolver integration
- **Validation**: Zod for schema validation throughout the application
- **Utility Functions**: clsx and tailwind-merge for conditional styling