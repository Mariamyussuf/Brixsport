# Team API Documentation

## Overview
The Team API provides endpoints for managing teams in a multi-sport competition platform. Teams are fundamental entities that participate in competitions, matches, and have players assigned to them.

## Authentication
All endpoints (except for GET endpoints) require authentication via JWT. Role-based access control is implemented as follows:
- **ADMIN**: Full access to all team operations
- **ORGANIZER**: Can create/update teams for assigned competitions
- **LOGGER**: Can update team information during matches
- **USER**: Can view public team information
- **PUBLIC**: Can view limited public team information

## Base URL
```
/api/v1/teams
```

## Endpoints

### Get Teams
```
GET /api/v1/teams
```

Retrieve a list of teams with pagination and filtering options.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20, max: 100) - Number of items per page
- `sport` (optional) - Filter by sport (FOOTBALL, BASKETBALL, TRACK)
- `status` (optional) - Filter by status (ACTIVE, INACTIVE, SUSPENDED)
- `search` (optional) - Search by name or city
- `sortBy` (optional, default: "name") - Sort field (name, city, foundedYear)
- `sortOrder` (optional, default: "ASC") - Sort order (ASC/DESC)

**Response:**
```json
{
  "teams": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "foundedYear": "number",
      "logoUrl": "string",
      "stadium": "string",
      "city": "string",
      "country": "string",
      "colorPrimary": "string",
      "colorSecondary": "string",
      "sport": "FOOTBALL|BASKETBALL|TRACK",
      "status": "ACTIVE|INACTIVE|SUSPENDED",
      "websiteUrl": "string",
      "socialMediaLinks": {
        "twitter": "string",
        "instagram": "string",
        "facebook": "string"
      },
      "coachName": "string",
      "captainId": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

### Search Teams
```
GET /api/v1/teams/search
```

Advanced search for teams.

**Query Parameters:**
- `q` - Search query (name, city, stadium, etc.)
- `sports` - Comma-separated list of sports
- `countries` - Comma-separated list of countries
- `minFoundedYear` - Minimum founding year
- `maxFoundedYear` - Maximum founding year

**Response:**
```json
{
  "teams": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "foundedYear": "number",
      "logoUrl": "string",
      "stadium": "string",
      "city": "string",
      "country": "string",
      "colorPrimary": "string",
      "colorSecondary": "string",
      "sport": "FOOTBALL|BASKETBALL|TRACK",
      "status": "ACTIVE|INACTIVE|SUSPENDED",
      "websiteUrl": "string",
      "socialMediaLinks": {
        "twitter": "string",
        "instagram": "string",
        "facebook": "string"
      },
      "coachName": "string",
      "captainId": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ],
  "count": "number"
}
```

### Get Team by ID
```
GET /api/v1/teams/{id}
```

Retrieve detailed information about a specific team.

**Response:**
```json
{
  "team": {
    "id": "string",
    "name": "string",
    "description": "string",
    "foundedYear": "number",
    "logoUrl": "string",
    "stadium": "string",
    "city": "string",
    "country": "string",
    "colorPrimary": "string",
    "colorSecondary": "string",
    "sport": "FOOTBALL|BASKETBALL|TRACK",
    "status": "ACTIVE|INACTIVE|SUSPENDED",
    "websiteUrl": "string",
    "socialMediaLinks": {
      "twitter": "string",
      "instagram": "string",
      "facebook": "string"
    },
    "coachName": "string",
    "captainId": "string",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

### Create Team
```
POST /api/v1/teams
```

Create a new team.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "foundedYear": "number",
  "logoUrl": "string",
  "stadium": "string",
  "city": "string",
  "country": "string",
  "colorPrimary": "string",
  "colorSecondary": "string",
  "sport": "FOOTBALL|BASKETBALL|TRACK",
  "websiteUrl": "string",
  "socialMediaLinks": {
    "twitter": "string",
    "instagram": "string",
    "facebook": "string"
  },
  "coachName": "string"
}
```

**Response:**
```json
{
  "team": {
    "id": "string",
    "name": "string",
    "description": "string",
    "foundedYear": "number",
    "logoUrl": "string",
    "stadium": "string",
    "city": "string",
    "country": "string",
    "colorPrimary": "string",
    "colorSecondary": "string",
    "sport": "FOOTBALL|BASKETBALL|TRACK",
    "status": "ACTIVE",
    "websiteUrl": "string",
    "socialMediaLinks": {
      "twitter": "string",
      "instagram": "string",
      "facebook": "string"
    },
    "coachName": "string",
    "captainId": "string",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

### Update Team
```
PUT /api/v1/teams/{id}
```

Update an existing team's information.

**Request Body:**
Same as POST but all fields are optional.

**Response:**
```json
{
  "team": {
    "id": "string",
    "name": "string",
    "description": "string",
    "foundedYear": "number",
    "logoUrl": "string",
    "stadium": "string",
    "city": "string",
    "country": "string",
    "colorPrimary": "string",
    "colorSecondary": "string",
    "sport": "FOOTBALL|BASKETBALL|TRACK",
    "status": "ACTIVE|INACTIVE|SUSPENDED",
    "websiteUrl": "string",
    "socialMediaLinks": {
      "twitter": "string",
      "instagram": "string",
      "facebook": "string"
    },
    "coachName": "string",
    "captainId": "string",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

### Delete Team
```
DELETE /api/v1/teams/{id}
```

Delete a team (soft delete).

**Response:**
```json
{
  "message": "Team deleted successfully"
}
```

### Get Team Players
```
GET /api/v1/teams/{id}/players
```

Retrieve all players belonging to a specific team.

**Query Parameters:**
- `status` (optional) - Filter by player status
- `position` (optional) - Filter by position

**Response:**
```json
{
  "players": [
    {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "displayName": "string",
      "dateOfBirth": "date",
      "nationality": "string",
      "gender": "MALE|FEMALE|OTHER",
      "sport": "FOOTBALL|BASKETBALL|TRACK",
      "position": "string",
      "height": "number",
      "weight": "number",
      "teamId": "string",
      "status": "ACTIVE|INACTIVE|SUSPENDED|RETIRED",
      "profilePictureUrl": "string",
      "biography": "string",
      "socialMediaLinks": {
        "twitter": "string",
        "instagram": "string",
        "facebook": "string"
      },
      "careerStats": {
        "matchesPlayed": "number",
        "goals": "number",
        "assists": "number",
        "points": "number",
        "rebounds": "number",
        "steals": "number",
        "blocks": "number",
        "personalBests": [
          {
            "event": "string",
            "timeOrDistance": "string"
          }
        ]
      },
      "createdAt": "date",
      "updatedAt": "date"
    }
  ]
}
```

### Add Player to Team
```
POST /api/v1/teams/{id}/players
```

Add a player to a team.

**Request Body:**
```json
{
  "playerId": "string"
}
```

**Response:**
```json
{
  "message": "Player added to team successfully",
  "player": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "displayName": "string",
    "dateOfBirth": "date",
    "nationality": "string",
    "gender": "MALE|FEMALE|OTHER",
    "sport": "FOOTBALL|BASKETBALL|TRACK",
    "position": "string",
    "height": "number",
    "weight": "number",
    "teamId": "string",
    "status": "ACTIVE|INACTIVE|SUSPENDED|RETIRED",
    "profilePictureUrl": "string",
    "biography": "string",
    "socialMediaLinks": {
      "twitter": "string",
      "instagram": "string",
      "facebook": "string"
    },
    "careerStats": {
      "matchesPlayed": "number",
      "goals": "number",
      "assists": "number",
      "points": "number",
      "rebounds": "number",
      "steals": "number",
      "blocks": "number",
      "personalBests": [
        {
          "event": "string",
          "timeOrDistance": "string"
        }
      ]
    },
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

### Remove Player from Team
```
DELETE /api/v1/teams/{id}/players/{playerId}
```

Remove a player from a team.

**Response:**
```json
{
  "message": "Player removed from team successfully"
}
```

### Get Team Matches
```
GET /api/v1/teams/{id}/matches
```

Retrieve all matches for a specific team with pagination.

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `status` (optional) - Filter by match status
- `competitionId` (optional) - Filter by competition

**Response:**
```json
{
  "matches": [
    {
      "id": "string",
      "competitionId": "string",
      "homeTeamId": "string",
      "awayTeamId": "string",
      "venue": "string",
      "startTime": "date",
      "status": "SCHEDULED|LIVE|COMPLETED|POSTPONED|CANCELLED",
      "homeScore": "number",
      "awayScore": "number",
      "sport": "FOOTBALL|BASKETBALL|TRACK"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

### Get Team Statistics
```
GET /api/v1/teams/{id}/stats
```

Retrieve statistics for a team.

**Response:**
```json
{
  "stats": {
    "matchesPlayed": "number",
    "wins": "number",
    "draws": "number",
    "losses": "number",
    "goalsFor": "number",
    "goalsAgainst": "number",
    "cleanSheets": "number",
    "yellowCards": "number",
    "redCards": "number"
  }
}
```

### Get Team Competitions
```
GET /api/v1/teams/{id}/competitions
```

Retrieve all competitions a team is participating in.

**Response:**
```json
{
  "competitions": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "sport": "FOOTBALL|BASKETBALL|TRACK",
      "startDate": "date",
      "endDate": "date",
      "status": "UPCOMING|ONGOING|COMPLETED|CANCELLED",
      "organizerId": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ]
}
```

## Error Responses

All error responses follow this format:
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object (optional)"
  }
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict (e.g., team already exists)
- 500: Internal Server Error