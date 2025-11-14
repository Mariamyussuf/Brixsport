# Use Node.js 20 as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy backend package files
COPY brixsport-backend/package*.json ./brixsport-backend/
COPY brixsport-backend/apps/api/package*.json ./brixsport-backend/apps/api/
COPY brixsport-backend/packages/database/package*.json ./brixsport-backend/packages/database/

# Install root dependencies
RUN npm ci --only=production

# Install backend dependencies
RUN cd brixsport-backend && npm ci --only=production

# Install database package dependencies
RUN cd brixsport-backend/packages/database && npm ci --only=production

# Install API app dependencies
RUN cd brixsport-backend/apps/api && npm ci --only=production

# Copy application code
COPY . .

# Generate Prisma client using the database package schema
RUN cd brixsport-backend/packages/database && npm run db:generate

# Build the backend application
RUN cd brixsport-backend && npm run build

# Expose port
EXPOSE 4000

# Start the application
CMD ["npm", "run", "start:api"]