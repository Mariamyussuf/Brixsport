#!/bin/bash

# Brixsport Database Migration Script

echo "Running database migrations..."

# Generate Prisma client
echo "Generating Prisma client..."
cd packages/database
npm run db:generate

# Run migrations
echo "Running migrations..."
npm run db:migrate

# Seed database (if needed)
echo "Seeding database..."
npm run db:seed

echo "Database migrations complete!"