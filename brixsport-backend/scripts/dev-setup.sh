#!/bin/bash

# Brixsport Development Setup Script

echo "Setting up Brixsport development environment..."

# Create logs directory
mkdir -p apps/api/logs

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install API dependencies
echo "Installing API dependencies..."
cd apps/api
npm install
cd ../..

# Install shared package dependencies
echo "Installing shared package dependencies..."
cd packages/shared
npm install
cd ../..

# Install database package dependencies
echo "Installing database package dependencies..."
cd packages/database
npm install
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

echo "Development environment setup complete!"
echo "To start the development server with Docker, run: docker-compose up"
echo "To start the development server directly (without Docker), run: npm run dev:direct"
echo "On Windows, you can also run: npm run dev:direct:windows"