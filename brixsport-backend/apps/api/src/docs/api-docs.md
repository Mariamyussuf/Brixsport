# Brixsport API Documentation

## Authentication

### POST /api/v1/auth/signup
User registration with email verification

### POST /api/v1/auth/login
Login with optional MFA

### POST /api/v1/auth/refresh
Rotate access + refresh tokens

### POST /api/v1/auth/logout
Invalidate refresh token

### POST /api/v1/auth/logout-all
Invalidate all user sessions

## User Management

### GET /api/v1/user/me
Current user profile

### PUT /api/v1/user/me
Update profile

### GET /api/v1/user/me/preferences
User preferences

### PUT /api/v1/user/me/preferences
Update preferences

## Favorites & Following

### GET /api/v1/favorites/teams
User's favorite teams

### POST /api/v1/favorites/teams
Add favorite team

### DELETE /api/v1/favorites/teams/:id
Remove favorite team

## Competitions

### GET /api/v1/competitions
List competitions with filters

### GET /api/v1/competitions/:id
Competition details

### GET /api/v1/competitions/:id/matches
Competition matches

## Teams

### GET /api/v1/teams
List teams with search/filter

### GET /api/v1/teams/:id
Team details

## Players

### GET /api/v1/players
List players with search

### GET /api/v1/players/:id
Player profile

## Matches

### GET /api/v1/matches
List matches with advanced filters

### GET /api/v1/matches/:id
Match details

## Live Match Management

### GET /api/v1/live/:matchId/state
Current match state

### PUT /api/v1/live/:matchId/state
Update match state (logger)

### POST /api/v1/live/:matchId/events
Add new event (logger)

## Track & Field Events

### GET /api/v1/track/events
List track events

### POST /api/v1/track/events
Create track event (admin)

## Logger Tools & Workflow

### GET /api/v1/logger/dashboard
Logger dashboard

### GET /api/v1/logger/assignments
Assigned matches

## Admin Panel

### GET /api/v1/admin/users
List all users with filters

### GET /api/v1/admin/loggers
List loggers

## Notifications & Communications

### GET /api/v1/notifications
User notifications

## Analytics Integration

### GET /api/v1/analytics/players/:id/performance
Player performance metrics

### GET /api/v1/analytics/teams/:id/performance
Team performance

## Statistics API

### GET /api/v1/statistics/players/:id
Get detailed player statistics

### GET /api/v1/statistics/players/:id/trends
Get player performance trends

### GET /api/v1/statistics/players/:id/comparison
Compare player performance with league average or other players

### GET /api/v1/statistics/teams/:id
Get detailed team statistics

### GET /api/v1/statistics/teams/:id/trends
Get team performance trends

### GET /api/v1/statistics/teams/:id/comparison
Compare team performance with league average or other teams

### GET /api/v1/statistics/competitions/:id
Get detailed competition statistics

### GET /api/v1/statistics/competitions/:id/standings
Get competition standings

### GET /api/v1/statistics/competitions/:id/top-performers
Get top performers in a competition

### GET /api/v1/statistics/analytics/player-performance/:id
Generate player performance analytics report

### GET /api/v1/statistics/analytics/team-performance/:id
Generate team performance analytics report

### POST /api/v1/statistics/analytics/compare
Compare multiple entities (players, teams, or competitions)

## Data Synchronization

### POST /api/v1/sync/events
Batch upload offline events

## WebSocket Events

### match:join
Join match room

### match:leave
Leave match room

### match:state
Match state change

### match:event
New match event

### match:commentary
Live commentary

### match:stats
Updated statistics

### admin:user_activity
User activity monitoring

### admin:system_alert
System alerts

### admin:logger_status
Logger online/offline

### notification:new
New notification

### notification:read
Notification read

## Media Management

### POST /api/v1/media/upload
Initiate file upload with metadata

### POST /api/v1/media/upload/presigned-url/:id
Generate pre-signed URL for direct upload

### POST /api/v1/media/upload/complete/:id
Confirm upload completion

### POST /api/v1/media/upload/cancel/:id
Cancel failed uploads

### GET /api/v1/media/:id
Get media file details

### GET /api/v1/media/:id/download
Download media file

### GET /api/v1/media
List media files with filtering and pagination

### PUT /api/v1/media/:id
Update media metadata

### DELETE /api/v1/media/:id
Delete media file

### POST /api/v1/media/:id/process
Trigger media processing

### GET /api/v1/media/:id/thumbnails
Get generated thumbnails

### POST /api/v1/media/:id/resize
Generate custom resized versions

### POST /api/v1/media/:id/convert
Convert file format

### POST /api/v1/media/batch
Upload multiple files

### DELETE /api/v1/media/batch
Delete multiple files

### PUT /api/v1/media/batch/metadata
Update metadata for multiple files