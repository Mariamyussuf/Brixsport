# Brixsport Statistics API Documentation

## Overview

The Statistics API provides comprehensive sports statistics and analytics for players, teams, and competitions across multiple sports (football, basketball, and track events). This API enables performance tracking, trend analysis, comparative analytics, and detailed reporting.

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Base URL

```
http://localhost:3001/api/v1
```

## Player Statistics

### Get Player Statistics

**Endpoint**: `GET /statistics/players/{id}`

Retrieve detailed statistics for a specific player.

**Path Parameters**:
- `id` (string, required): Player ID

**Responses**:
- `200`: Successful response with player statistics
- `404`: Player not found
- `500`: Internal server error

### Get Player Performance Trends

**Endpoint**: `GET /statistics/players/{id}/trends`

Retrieve performance trends for a specific player.

**Path Parameters**:
- `id` (string, required): Player ID

**Query Parameters**:
- `period` (string, optional): Time period for trends (DAILY, WEEKLY, MONTHLY, SEASON)
- `limit` (integer, optional): Number of data points to return (1-50)

**Responses**:
- `200`: Successful response with performance trends
- `404`: Player not found
- `500`: Internal server error

### Compare Player Performance

**Endpoint**: `GET /statistics/players/{id}/comparison`

Compare a player's performance with league averages or specific competitors.

**Path Parameters**:
- `id` (string, required): Player ID

**Query Parameters**:
- `compareWith` (string, required): Comparison target (league_average or comma-separated player IDs)
- `metrics` (string, optional): Comma-separated list of metrics to compare

**Responses**:
- `200`: Successful response with comparison data
- `400`: Bad request
- `404`: Player not found
- `500`: Internal server error

## Team Statistics

### Get Team Statistics

**Endpoint**: `GET /statistics/teams/{id}`

Retrieve detailed statistics for a specific team.

**Path Parameters**:
- `id` (string, required): Team ID

**Responses**:
- `200`: Successful response with team statistics
- `404`: Team not found
- `500`: Internal server error

### Get Team Performance Trends

**Endpoint**: `GET /statistics/teams/{id}/trends`

Retrieve performance trends for a specific team.

**Path Parameters**:
- `id` (string, required): Team ID

**Query Parameters**:
- `period` (string, optional): Time period for trends (DAILY, WEEKLY, MONTHLY, SEASON)
- `limit` (integer, optional): Number of data points to return (1-50)

**Responses**:
- `200`: Successful response with performance trends
- `404`: Team not found
- `500`: Internal server error

### Compare Team Performance

**Endpoint**: `GET /statistics/teams/{id}/comparison`

Compare a team's performance with league averages or specific competitors.

**Path Parameters**:
- `id` (string, required): Team ID

**Query Parameters**:
- `compareWith` (string, required): Comparison target (league_average or comma-separated team IDs)
- `metrics` (string, optional): Comma-separated list of metrics to compare

**Responses**:
- `200`: Successful response with comparison data
- `400`: Bad request
- `404`: Team not found
- `500`: Internal server error

## Competition Statistics

### Get Competition Statistics

**Endpoint**: `GET /statistics/competitions/{id}`

Retrieve detailed statistics for a specific competition.

**Path Parameters**:
- `id` (string, required): Competition ID

**Responses**:
- `200`: Successful response with competition statistics
- `500`: Internal server error

### Get Competition Standings

**Endpoint**: `GET /statistics/competitions/{id}/standings`

Retrieve current standings for a competition.

**Path Parameters**:
- `id` (string, required): Competition ID

**Query Parameters**:
- `sortBy` (string, optional): Field to sort by
- `sortOrder` (string, optional): Sort order (ASC, DESC)

**Responses**:
- `200`: Successful response with standings
- `500`: Internal server error

### Get Top Performers

**Endpoint**: `GET /statistics/competitions/{id}/top-performers`

Retrieve top performers in a competition.

**Path Parameters**:
- `id` (string, required): Competition ID

**Query Parameters**:
- `category` (string, required): Performance category (goals, assists, clean_sheets, etc.)
- `limit` (integer, optional): Number of performers to return (1-50)

**Responses**:
- `200`: Successful response with top performers
- `400`: Bad request
- `500`: Internal server error

## Analytics

### Generate Player Performance Analytics Report

**Endpoint**: `GET /statistics/analytics/player-performance/{id}`

Generate player performance analytics report.

**Path Parameters**:
- `id` (string, required): Player ID

**Query Parameters**:
- `timeRange` (string, optional): Time range for the report (week, month, season, custom)
- `startDate` (string, optional): Start date for custom time range (ISO 8601)
- `endDate` (string, optional): End date for custom time range (ISO 8601)

**Responses**:
- `200`: Successful response with analytics report
- `404`: Player not found
- `500`: Internal server error

### Generate Team Performance Analytics Report

**Endpoint**: `GET /statistics/analytics/team-performance/{id}`

Generate team performance analytics report.

**Path Parameters**:
- `id` (string, required): Team ID

**Query Parameters**:
- `timeRange` (string, optional): Time range for the report (week, month, season, custom)
- `startDate` (string, optional): Start date for custom time range (ISO 8601)
- `endDate` (string, optional): End date for custom time range (ISO 8601)

**Responses**:
- `200`: Successful response with analytics report
- `404`: Team not found
- `500`: Internal server error

### Compare Multiple Entities

**Endpoint**: `POST /statistics/analytics/compare`

Compare multiple entities (players, teams, or competitions).

**Request Body**:
```json
{
  "type": "PLAYER|TEAM|COMPETITION",
  "ids": ["string"],
  "metrics": ["string"]
}
```

**Responses**:
- `200`: Successful response with comparison result
- `400`: Bad request
- `500`: Internal server error

## Data Models

### PlayerStatistics

Detailed statistics for a player across different sports.

### TeamStatistics

Detailed statistics for a team across different sports.

### CompetitionStatistics

Statistics for an entire competition including general and sport-specific metrics.

### PerformanceTrend

Performance trends over time for players, teams, or competitions.

### Standing

Competition standings for teams.

### TopPerformer

Top performing player in a specific category.

### PlayerComparison

Comparison of a player's performance with others.

### TeamComparison

Comparison of a team's performance with others.

### PlayerAnalyticsReport

Detailed analytics report for a player's performance.

### TeamAnalyticsReport

Detailed analytics report for a team's performance.

### ComparisonResult

Result of comparing multiple entities.