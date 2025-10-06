# Brixsport Backend

Production-grade backend for the Brixsport campus live score application.

## Architecture

- **Node.js 20+ (TypeScript) + Express.js** - Main API server
- **Supabase PostgreSQL** - Database layer
- **Redis Cluster** - Caching, sessions, pub/sub, job queues
- **Socket.IO** - Real-time communications
- **BullMQ** - Background job processing
- **Zod** - Runtime type validation

## Project Structure

```
brixsport-backend/
├── apps/
│   ├── api/                    # Main Node.js API
│   └── analytics/              # Python Analytics Service
├── packages/
│   ├── shared/                 # Shared types and schemas
│   └── database/               # Database package
├── infrastructure/
│   ├── docker/                 # Docker configurations
│   └── k8s/                    # Kubernetes manifests
├── scripts/                    # Setup and deployment scripts
└── docker-compose.yml          # Local development
```

## Features

- Complete API coverage for current + future frontend features
- Real-time live scoring with conflict resolution
- Scalable microservices architecture
- Production monitoring, logging, and observability

## Development Setup

1. Run `npm run setup` to install dependencies
2. Configure environment variables for Supabase connection:

   **Create a `.env` file in the `apps/api/` directory:**
   ```env
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key

   # Database
   DATABASE_URL=your_database_connection_string

   # Security
   JWT_SECRET=your_jwt_secret_key

   # CORS
   ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

   # Redis (optional)
   REDIS_URL=redis://localhost:6379
   ```

   **⚠️ SECURITY WARNING:** Never commit actual secret values to version control. Use environment variables for all sensitive data.

3. Choose your preferred development environment:

   ### Option A: Using Docker (default)
   Create a `.env` file in the root `brixsport-backend/` directory with all required environment variables, then run:
   ```bash
   npm run dev
   ```

   ### Option B: Direct execution (alternative to Docker)
   Run `npm run dev:direct` to start services directly without Docker

   ### Option C: Windows batch script (alternative to Docker)
   Run `npm run dev:direct:windows` to start services using Windows batch script

## Database Integration

The backend now uses Supabase PostgreSQL instead of a local PostgreSQL instance:
- **Provider**: Supabase PostgreSQL
- **Connection**: Configured through environment variables
- **ORM**: Direct Supabase client integration
- **Schema**: Defined in Supabase dashboard

## Removed Dependencies

This backend replaces the former Render-hosted backend that is no longer available:
- Eliminated dependency on external hosting
- Removed all mock data implementations
- Replaced with real database operations
- Maintained backward compatibility with frontend

## Deployment

1. Run `npm run deploy` to build and deploy the application
2. Ensure Supabase environment variables are configured in your deployment environment

## API Documentation

API documentation is available at `/api/docs` when the server is running.