# Health and Monitoring API Endpoints Documentation

## Health Check Endpoint

### Endpoint
`GET /api/health`

### Description
This endpoint performs a health check of the application by verifying connectivity to the database and other critical services.

### Authentication
This endpoint does not require authentication.

### Request Format
```http
GET /api/health
```

### Response Format

#### Success Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "success": true,
  "data": {
    "supabase": "connected",
    "matches": 5,
    "timestamp": "2023-01-01T00:00:00.000Z"
  }
}
```

#### Error Response
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json
```

```json
{
  "success": false,
  "error": {
    "message": "Supabase connection failed",
    "details": "Error message",
    "code": "error_code"
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### Implementation Details
The endpoint checks connectivity to Supabase by attempting to fetch a small set of matches. If successful, it returns connection status and basic information. If any step fails, it returns an error with details.

### Related Files
- `app/api/health/route.ts` - The implementation of this endpoint

## Ping Endpoint

### Endpoint
`GET /api/ping`

### Description
A simple ping endpoint to check if the API is responsive.

### Authentication
This endpoint does not require authentication.

### Request Format
```http
GET /api/ping
```

### Response Format
```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "timestamp": 1678886400000
}
```

### Related Files
- `app/api/ping/route.ts` - The implementation of this endpoint

## HEAD Ping Endpoint

### Endpoint
`HEAD /api/ping`

### Description
A simple HEAD request endpoint to check if the API is responsive without returning a response body.

### Authentication
This endpoint does not require authentication.

### Request Format
```http
HEAD /api/ping
```

### Response Format
```http
HTTP/1.1 200 OK
```

### Related Files
- `app/api/ping/route.ts` - The implementation of this endpoint

## Cache Statistics Endpoint

### Endpoint
`GET /api/cache/stats`

### Description
Returns statistics about the cache system including Redis metrics, cache warming status, and health information.

### Authentication
This endpoint does not require authentication.

### Request Format
```http
GET /api/cache/stats
```

### Response Format

#### Success Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "success": true,
  "data": {
    "timestamp": "2023-01-01T00:00:00.000Z",
    "redis": {
      // Redis metrics
    },
    "cache": {
      // Cache statistics
    },
    "warming": {
      // Cache warming statistics
    },
    "health": {
      "redis": true,
      "circuitBreaker": true
    }
  }
}
```

#### Error Response
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json
```

```json
{
  "success": false,
  "error": "Failed to fetch cache statistics"
}
```

### Related Files
- `app/api/cache/stats/route.ts` - The implementation of this endpoint

## Cache Management Endpoint

### Endpoint
`POST /api/cache/stats`

### Description
Performs cache management actions such as warming, clearing, or resetting metrics.

### Authentication
This endpoint does not require authentication.

### Request Format
```http
POST /api/cache/stats
Content-Type: application/json
```

```json
{
  "action": "warm|clear|resetMetrics"
}
```

### Response Format

#### Success Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "success": true,
  "message": "Cache warming initiated|Cache cleared successfully|Metrics reset successfully"
}
```

#### Error Response
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
```

```json
{
  "success": false,
  "error": "Invalid action"
}
```

Or:

```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json
```

```json
{
  "success": false,
  "error": "Failed to perform cache action"
}
```

### Related Files
- `app/api/cache/stats/route.ts` - The implementation of this endpoint

## Search Endpoint

### Endpoint
`GET /api/search`

### Description
Performs a search across players, competitions, and teams.

### Authentication
This endpoint does not require authentication for basic search functionality.

### Request Format
```http
GET /api/search?query=search_term&types=player&types=team&limit=10
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | The search term |
| types | array | No | Filter by types (player, team, competition) |
| limit | number | No | Limit the number of results (default: 10) |

### Response Format

#### Success Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  // Search results from backend API
}
```

#### Error Response
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
```

```json
{
  "success": false,
  "message": "bad_request",
  "details": "Query parameter is required"
}
```

Or:

```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json
```

```json
{
  "success": false,
  "message": "server_error",
  "details": "Internal server error"
}
```

### Implementation Details
The endpoint forwards search requests to the backend search API and returns the results. It supports filtering by entity types and limiting the number of results.

### Related Files
- `app/api/search/route.ts` - The implementation of this endpoint