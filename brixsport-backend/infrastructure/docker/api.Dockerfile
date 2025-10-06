# Use Node.js 20 as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY apps/api/package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY apps/api/ .

# Expose port
EXPOSE 4000

# Build the application
RUN npm run build

# Start the application
CMD ["npm", "start"]