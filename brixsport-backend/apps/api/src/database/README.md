# Database Schema Documentation

This directory contains the database schema definitions for the Brixsport application.

## Schema Overview

The schema includes the following tables:

1. **favorites** - Stores user favorite entities (players, teams, matches, etc.)
2. **user_sessions** - Manages user session tokens for authentication
3. **user_mfa** - Stores Multi-Factor Authentication configuration for users
4. **email_verification** - Manages email verification tokens for user registration
5. **password_reset** - Manages password reset tokens for account recovery

## Table Details

### favorites
Stores user favorite entities across different types of sports entities.

- `id` (UUID) - Primary key
- `user_id` (UUID) - Reference to the user
- `entity_type` (VARCHAR) - Type of entity (player, team, match, competition, sport)
- `entity_id` (UUID) - Reference to the specific entity
- `created_at` (TIMESTAMP) - When the favorite was created
- `updated_at` (TIMESTAMP) - When the favorite was last updated

### user_sessions
Manages user session tokens for authentication with additional security information.

- `id` (UUID) - Primary key
- `user_id` (UUID) - Reference to the user
- `session_token` (VARCHAR) - Unique session token
- `refresh_token` (TEXT) - Refresh token for session renewal
- `ip_address` (VARCHAR) - IP address of the session
- `user_agent` (TEXT) - User agent of the session
- `created_at` (TIMESTAMP) - When the session was created
- `expires_at` (TIMESTAMP) - When the session expires
- `last_accessed_at` (TIMESTAMP) - When the session was last accessed

### user_mfa
Stores Multi-Factor Authentication configuration for users.

- `id` (UUID) - Primary key
- `user_id` (UUID) - Reference to the user (unique)
- `secret_key` (TEXT) - TOTP secret key
- `recovery_codes` (TEXT[]) - Array of recovery codes
- `is_enabled` (BOOLEAN) - Whether MFA is enabled
- `created_at` (TIMESTAMP) - When MFA was configured
- `updated_at` (TIMESTAMP) - When MFA was last updated
- `enabled_at` (TIMESTAMP) - When MFA was enabled

### email_verification
Manages email verification tokens for user registration.

- `id` (UUID) - Primary key
- `user_id` (UUID) - Reference to the user
- `email` (VARCHAR) - Email address being verified
- `verification_token` (VARCHAR) - Unique verification token
- `created_at` (TIMESTAMP) - When the token was created
- `expires_at` (TIMESTAMP) - When the token expires
- `verified_at` (TIMESTAMP) - When the email was verified
- `is_used` (BOOLEAN) - Whether the token has been used

### password_reset
Manages password reset tokens for account recovery.

- `id` (UUID) - Primary key
- `user_id` (UUID) - Reference to the user
- `reset_token` (VARCHAR) - Unique reset token
- `created_at` (TIMESTAMP) - When the token was created
- `expires_at` (TIMESTAMP) - When the token expires
- `used_at` (TIMESTAMP) - When the token was used
- `is_used` (BOOLEAN) - Whether the token has been used

## Indexes

Each table includes appropriate indexes for performance optimization:

- Primary key indexes
- Foreign key indexes
- Unique constraint indexes
- Composite indexes for common query patterns

## Constraints

The schema includes various constraints to ensure data integrity:

- Primary key constraints
- Unique constraints
- Foreign key constraints (commented out by default)
- Check constraints for data validation

## Usage

To apply this schema to your Supabase database:

1. Copy the contents of `schema.sql`
2. Paste it into the Supabase SQL editor
3. Run the SQL statements

Note: Foreign key constraints are commented out by default as they require the existence of a `users` table. Uncomment and adjust these constraints based on your actual user table structure.