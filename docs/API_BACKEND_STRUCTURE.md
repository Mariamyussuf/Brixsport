# Brixsport Backend API Structure Documentation

This document describes the structure and organization of the Brixsport backend API.

## API Organization

The backend API is organized into several modules, each responsible for different aspects of the application:

```
brixsport-backend/
└── apps/
    └── api/
        ├── src/
        │   ├── controllers/     # Request handlers
        │   ├── middleware/      # Middleware functions
        │   ├── routes/          # Route definitions
        │   ├── services/        # Business logic
        │   ├── utils/           # Utility functions
        │   ├── docs/            # API documentation
        │   └── app.ts           # Express app setup
        └── prisma/              # Database schema and migrations
```

## Main Modules

### Authentication Module
Handles user registration, login, token management, and authentication middleware.

**Files**:
- `src/controllers/auth.controller.ts`
- `src/routes/auth.routes.ts`
- `src/middleware/auth.middleware.ts`

### User Management Module
Manages user profiles, preferences, and administrative user functions.

**Files**:
- `src/controllers/user.controller.ts`
- `src/routes/user.routes.ts`

### Competitions Module
Handles competition data, including creation, updating, and querying competitions.

**Files**:
- `src/controllers/competitions.controller.ts`
- `src/routes/competitions.routes.ts`

### Teams Module
Manages team information and team-related operations.

**Files**:
- `src/controllers/teams.controller.ts`
- `src/routes/teams.routes.ts`

### Players Module
Handles player data and player-related operations.

**Files**:
- `src/controllers/players.controller.ts`
- `src/routes/players.routes.ts`

### Matches Module
Manages match data, scheduling, and match-related operations.

**Files**:
- `src/controllers/matches.controller.ts`
- `src/routes/matches.routes.ts`

### Live Match Management Module
Handles real-time match updates and event logging.

**Files**:
- `src/controllers/live.controller.ts`
- `src/routes/live.routes.ts`

### Analytics Module
Manages analytics data collection and reporting.

**Files**:
- `src/controllers/analytics.controller.ts`
- `src/routes/analytics.routes.ts`

### Statistics Module
Handles statistical calculations and reporting.

**Files**:
- `src/controllers/statistics.controller.ts`
- `src/routes/statistics.routes.ts`

### Media Management Module
Manages file uploads, processing, and media assets.

**Files**:
- `src/controllers/media.controller.ts`
- `src/routes/media.routes.ts`

### Notifications Module
Handles notification sending and management.

**Files**:
- `src/controllers/notifications.controller.ts`
- `src/routes/notifications.routes.ts`

### Cache Management Module
Manages caching strategies and cache operations.

**Files**:
- `src/controllers/cache.controller.ts`
- `src/routes/cache.routes.ts`

### Search Module
Handles search functionality across different entity types.

**Files**:
- `src/controllers/search.controller.ts`
- `src/routes/search.routes.ts`

### Admin Module
Provides administrative functions and system management.

**Files**:
- `src/controllers/admin.controller.ts`
- `src/routes/admin.routes.ts`

### Logger Module
Manages logger-specific functionality and workflows.

**Files**:
- `src/controllers/logger.controller.ts`
- `src/routes/logger.routes.ts`

## API Documentation Files

The backend API includes comprehensive documentation in the `src/docs/` directory:

### Main API Documentation
- `api-docs.md` - Comprehensive API documentation covering all endpoints
- `swagger.json` - OpenAPI 3.0 specification for the main API

### Module-Specific Documentation
- `media-api.md` - Detailed documentation for media management endpoints
- `statistics.docs.md` - Documentation for statistics API endpoints
- `teams.docs.md` - Documentation for teams API endpoints
- `analytics.websocket.md` - Documentation for WebSocket analytics

### Module-Specific OpenAPI Specifications
- `statistics.swagger.json` - OpenAPI specification for statistics endpoints
- `teams.swagger.json` - OpenAPI specification for teams endpoints

## Middleware

The API uses several middleware functions for common functionality:

### Authentication Middleware
- `auth.middleware.ts` - Validates JWT tokens and sets user context

### Validation Middleware
- `validation.middleware.ts` - Validates request parameters and body data

### Rate Limiting Middleware
- `rateLimit.middleware.ts` - Implements API rate limiting

### Performance Monitoring Middleware
- `performance.middleware.ts` - Tracks API performance metrics

### Error Handling Middleware
- `errorHandler.middleware.ts` - Centralized error handling

## Services

The API uses service layers to encapsulate business logic:

### Database Services
- `supabase.service.ts` - Supabase database operations
- `prisma.service.ts` - Prisma ORM operations

### External Services
- `redis.service.ts` - Redis caching operations
- `websocket.service.ts` - WebSocket communication
- `notification.service.ts` - Notification sending
- `media.service.ts` - Media processing and storage

### Utility Services
- `logger.ts` - Logging functionality
- `config.service.ts` - Configuration management

## Routes Structure

The API routes are organized hierarchically:

```
/api/
├── /v1/
│   ├── /auth/           # Authentication endpoints
│   ├── /user/           # User management endpoints
│   ├── /competitions/   # Competition endpoints
│   ├── /teams/          # Team endpoints
│   ├── /players/        # Player endpoints
│   ├── /matches/        # Match endpoints
│   ├── /live/           # Live match endpoints
│   ├── /analytics/      # Analytics endpoints
│   ├── /statistics/     # Statistics endpoints
│   ├── /media/          # Media management endpoints
│   ├── /notifications/  # Notification endpoints
│   ├── /cache/          # Cache management endpoints
│   ├── /search/         # Search endpoints
│   ├── /admin/          # Admin endpoints
│   └── /logger/         # Logger endpoints
├── /docs/               # Documentation endpoints
└── /                    # Health check endpoints
```

## API Versioning

The API uses URL versioning with `/v1/` as the current version prefix. All endpoints are accessed through the versioned path structure.

## Error Handling

The API implements consistent error handling with standardized response formats:

```json
{
  "success": false,
  "error": "Error code",
  "message": "Human-readable error message"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per 15 minutes for authenticated users
- 10 requests per 15 minutes for unauthenticated users

## Security

The API implements several security measures:
- JWT-based authentication
- Input validation
- Rate limiting
- CORS configuration
- Secure headers

## Monitoring and Logging

The API includes comprehensive monitoring and logging:
- Performance metrics collection
- Error tracking
- Request logging
- Health check endpoints

## Deployment

The API can be deployed in several ways:
- Standalone Node.js server
- Docker container
- Cloud platforms (Railway, Heroku, etc.)

Configuration is managed through environment variables as defined in the `.env.example` file.