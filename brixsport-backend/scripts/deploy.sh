#!/bin/bash

# Brixsport Deployment Script

echo "Deploying Brixsport application..."

# Build API
echo "Building API..."
cd apps/api
npm run build
cd ../..

# Build shared package
echo "Building shared package..."
cd packages/shared
npm run build
cd ../..

# Generate Prisma client
echo "Generating Prisma client..."
cd packages/database
npm run db:generate
cd ../..

# Run database migrations
echo "Running database migrations..."
cd packages/database
npm run db:migrate
cd ../..

echo "Deployment complete!"