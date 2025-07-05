# Receita Rápida - Automated Recipe Blog

## Overview

This is a modern, automated recipe blog application called "Receita Rápida" (Quick Recipe) that generates complete recipe posts from simple text prompts using AI. The application features a clean, responsive design with green and fresh color themes that evoke culinary freshness and simplicity.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI design
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Design System**: Custom color scheme with fresh greens, warm oranges, and light grays

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration for secure user management
- **AI Integration**: OpenAI GPT-4o for automated content generation
- **Session Management**: Express session with PostgreSQL store

### Data Storage Solutions
- **Primary Database**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle ORM with schema-first approach
- **Migration Management**: Drizzle Kit for database migrations

## Key Components

### Recipe Generation System
- AI-powered recipe creation from simple text prompts
- Automatic generation of titles, descriptions, ingredients, instructions, and tips
- SEO optimization with meta titles, descriptions, and keywords
- Automatic slug generation for SEO-friendly URLs

### Content Management
- Admin panel for recipe generation and management
- Form validation with difficulty levels and cooking time preferences
- Recipe editing, deletion, and organization capabilities

### User Interface
- Responsive design optimized for mobile, tablet, and desktop
- Modern card-based layout for recipe display
- Smooth animations and hover effects
- Social sharing functionality

### SEO Implementation
- Automatic meta tag generation
- Open Graph and Twitter Card support
- Schema.org structured data for recipes
- SEO-friendly URL structure with slugs

## Data Flow

1. **Recipe Creation**: Admin enters a simple phrase → OpenAI generates complete recipe data → System creates database entry with SEO metadata
2. **Content Display**: Client requests recipes → Server queries database → Formatted data sent to frontend → Rendered in responsive cards
3. **Recipe Viewing**: User clicks recipe → Client fetches full recipe by slug → Displays formatted content with sharing options

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **OpenAI**: AI content generation for recipes
- **@radix-ui/***: Accessible UI component primitives
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Type-safe database ORM

### Development Tools
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type safety across the application
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Production Build Process
1. Frontend: Vite builds React application to static assets
2. Backend: ESBuild bundles Express server for Node.js runtime
3. Database: Drizzle migrations ensure schema consistency

### Environment Configuration
- **Development**: Vite dev server with Express API proxy
- **Production**: Static files served by Express with API routes
- **Database**: Neon PostgreSQL with connection pooling

### Key Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API authentication
- `SESSION_SECRET`: Express session encryption key
- `REPLIT_DOMAINS`: Authentication domain configuration

## Changelog
- July 04, 2025. Initial setup
- July 04, 2025. Changed to GPT-3.5-turbo and DALL-E 2 for cost optimization per user request
- July 04, 2025. Implemented complete auto-generation system with admin controls and real-time stats
- July 04, 2025. Enhanced recipe system: increased hashtags from 5 to 10, added category and subcategory fields for filtering
- July 05, 2025. Implemented AWS S3 integration: automatic image compression (WebP format), optimized storage, and CDN-ready URLs for all generated recipe images

## User Preferences

Preferred communication style: Simple, everyday language.