import { prisma } from '@brixsport/database';
import { logger } from '../utils/logger';

// Log available Prisma models for debugging
logger.info('Prisma client initialized successfully');

export { prisma };