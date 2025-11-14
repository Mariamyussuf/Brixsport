# Brixsport API Documentation Overview

This document provides an overview of all API documentation files in the Brixsport project.

## Table of Contents

1. [Main API Documentation](#main-api-documentation)
2. [Web Vitals API](#web-vitals-api)
3. [Performance Metrics API](#performance-metrics-api)
4. [Health and Monitoring APIs](#health-and-monitoring-apis)
5. [Backend API Documentation](#backend-api-documentation)

## Main API Documentation

The main API documentation provides a comprehensive overview of all API endpoints in the Brixsport system.

**File**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

This document includes:
- Authentication methods
- User management endpoints
- Favorites and following endpoints
- Competitions, teams, and players endpoints
- Matches and live match management
- Logger tools and workflow
- Admin panel endpoints
- Notifications and communications
- Analytics and statistics APIs
- Media management endpoints
- WebSocket events
- Error handling and rate limiting

## Web Vitals API

Documentation for the Web Vitals API endpoint that receives Core Web Vitals metrics from frontend clients.

**File**: [API_WEB_VITALS.md](./API_WEB_VITALS.md)

This document includes:
- Endpoint details (`POST /api/analytics/web-vitals`)
- Request and response formats
- Parameter descriptions
- Web Vitals metrics explanation
- Implementation details
- Example requests

## Performance Metrics API

Documentation for the Performance Metrics API endpoint that receives navigation timing and performance data from frontend clients.

**File**: [API_PERFORMANCE_METRICS.md](./API_PERFORMANCE_METRICS.md)

This document includes:
- Endpoint details (`POST /api/monitoring/performance-metrics`)
- Request and response formats
- Parameter descriptions
- Performance metrics explanation
- Implementation details
- Example requests

## Health and Monitoring APIs

Documentation for various health check and monitoring endpoints.

**File**: [API_HEALTH_AND_MONITORING.md](./API_HEALTH_AND_MONITORING.md)

This document includes:
- Health check endpoint (`GET /api/health`)
- Ping endpoint (`GET /api/ping` and `HEAD /api/ping`)
- Cache statistics endpoint (`GET /api/cache/stats`)
- Cache management endpoint (`POST /api/cache/stats`)
- Search endpoint (`GET /api/search`)

## Backend API Documentation

The backend API has extensive documentation in the brixsport-backend directory.

**Files**:
- [brixsport-backend/apps/api/src/docs/api-docs.md](../brixsport-backend/apps/api/src/docs/api-docs.md) - Main API documentation
- [brixsport-backend/apps/api/src/docs/media-api.md](../brixsport-backend/apps/api/src/docs/media-api.md) - Media management API
- [brixsport-backend/apps/api/src/docs/statistics.docs.md](../brixsport-backend/apps/api/src/docs/statistics.docs.md) - Statistics API
- [brixsport-backend/apps/api/src/docs/teams.docs.md](../brixsport-backend/apps/api/src/docs/teams.docs.md) - Teams API
- [brixsport-backend/apps/api/src/docs/analytics.websocket.md](../brixsport-backend/apps/api/src/docs/analytics.websocket.md) - WebSocket analytics API

### Swagger/OpenAPI Documentation

The backend API also includes Swagger/OpenAPI specifications:

- [brixsport-backend/apps/api/src/docs/swagger.json](../brixsport-backend/apps/api/src/docs/swagger.json) - Main API specification
- [brixsport-backend/apps/api/src/docs/statistics.swagger.json](../brixsport-backend/apps/api/src/docs/statistics.swagger.json) - Statistics API specification
- [brixsport-backend/apps/api/src/docs/teams.swagger.json](../brixsport-backend/apps/api/src/docs/teams.swagger.json) - Teams API specification

## Accessing API Documentation

### Frontend API Routes

Frontend API routes are accessible at:
- `/api/*` - Various endpoints for health checks, monitoring, and frontend-specific functionality

### Backend API Routes

Backend API routes are accessible at:
- `http://localhost:3001/api/v1/*` - Main API endpoints
- `http://localhost:3001/api/docs` - Swagger UI documentation

## Additional Resources

- [Notification System Documentation](./NOTIFICATION_SYSTEM.md)
- [Notification Implementation Summary](./NOTIFICATION_IMPLEMENTATION_SUMMARY.md)