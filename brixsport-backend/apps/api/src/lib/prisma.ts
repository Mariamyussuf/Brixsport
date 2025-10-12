import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Log available Prisma models for debugging
logger.info('Available Prisma models:', Object.keys(PrismaClient.prototype));

// Create Prisma Client instance with the correct schema path
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Duration: ' + e.duration + 'ms');
});

prisma.$on('error', (e) => {
  console.error('Prisma Error:', e.message);
});

export { prisma };