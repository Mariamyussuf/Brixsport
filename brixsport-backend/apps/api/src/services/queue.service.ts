import { Queue, Worker, Job } from 'bullmq';
import { logger } from '../utils/logger';
import { notificationService } from './notification.service';

// Parse Redis URL into connection options
const parseRedisUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    const config: any = {
      host: urlObj.hostname,
      port: parseInt(urlObj.port || '6379'),
    };

    // Extract password from URL if present
    if (urlObj.password) {
      config.password = urlObj.password;
    }

    // Extract database number from pathname if present
    const dbMatch = urlObj.pathname.match(/\/(\d+)/);
    if (dbMatch) {
      config.db = parseInt(dbMatch[1]);
    }

    return config;
  } catch (error) {
    logger.error('Failed to parse Redis URL', error);
    return null;
  }
};

// Build Redis connection configuration
const buildRedisConnection = () => {
  // Priority 1: Use REDIS_PRIVATE_URL if available (Railway internal network)
  if (process.env.REDIS_PRIVATE_URL) {
    logger.info('BullMQ using REDIS_PRIVATE_URL');
    return parseRedisUrl(process.env.REDIS_PRIVATE_URL);
  }

  // Priority 2: Use REDIS_URL if available
  if (process.env.REDIS_URL) {
    logger.info('BullMQ using REDIS_URL');
    return parseRedisUrl(process.env.REDIS_URL);
  }

  // Priority 3: Build from individual components
  const host = process.env.REDIS_HOST || process.env.REDISHOST;
  const port = process.env.REDIS_PORT || process.env.REDISPORT;
  const password = process.env.REDIS_PASSWORD || process.env.REDISPASSWORD;

  // Only use component-based config if host is explicitly set (not defaulting to localhost)
  if (host && host !== 'localhost') {
    logger.info('BullMQ using Redis components', { host, port: port || '6379' });
    return {
      host,
      port: parseInt(port || '6379'),
      password: password || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
    };
  }

  // No Redis configuration found
  logger.warn('No Redis configuration found for BullMQ');
  return null;
};

const redisConnection = buildRedisConnection();
const isRedisConfigured = redisConnection !== null;

const redisOptions = isRedisConfigured ? {
  connection: redisConnection
} : undefined;

// Create queues
let notificationQueue: Queue | null = null;
let scheduledNotificationQueue: Queue | null = null;

if (isRedisConfigured && redisOptions) {
  try {
    notificationQueue = new Queue('notifications', redisOptions);
    scheduledNotificationQueue = new Queue('scheduled-notifications', redisOptions);
    logger.info('BullMQ queues initialized');
  } catch (error) {
    logger.error('Failed to initialize BullMQ queues', error);
  }
} else {
  logger.warn('Redis not configured, BullMQ queues disabled');
}

export const queueService = {
  // Add job to notification queue
  addNotificationJob: async (jobType: string, jobData: any, priority: number = 0) => {
    try {
      logger.info('Adding notification job to queue', { jobType, priority });

      if (!notificationQueue) {
        logger.warn('Notification queue not initialized, skipping job', { jobType });
        return {
          success: true,
          data: { id: 'skipped', name: jobType, data: jobData }
        };
      }

      const job = await notificationQueue.add(jobType, jobData, {
        priority,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      });

      return {
        success: true,
        data: {
          id: job.id,
          name: job.name,
          data: job.data
        }
      };
    } catch (error: any) {
      logger.error('Add notification job error', error);
      throw error;
    }
  },

  // Add job to scheduled notification queue
  addScheduledNotificationJob: async (jobData: any, delay: number) => {
    try {
      logger.info('Adding scheduled notification job to queue', { delay });

      if (!scheduledNotificationQueue) {
        logger.warn('Scheduled notification queue not initialized, skipping job');
        return {
          success: true,
          data: { id: 'skipped', name: 'scheduled_notification', data: jobData }
        };
      }

      const job = await scheduledNotificationQueue.add('scheduled_notification', jobData, {
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      });

      return {
        success: true,
        data: {
          id: job.id,
          name: job.name,
          data: job.data
        }
      };
    } catch (error: any) {
      logger.error('Add scheduled notification job error', error);
      throw error;
    }
  },

  // Process notification jobs
  processNotificationJobs: () => {
    try {
      logger.info('Starting notification job processor');

      if (!isRedisConfigured || !redisOptions) {
        logger.warn('Redis not configured, skipping worker initialization');
        return { success: true, message: 'Worker initialization skipped (Redis disabled)' };
      }

      // Create worker for notification jobs
      const notificationWorker = new Worker('notifications',
        async (job: Job) => {
          logger.info('Processing notification job', { jobId: job.id, jobType: job.name });

          try {
            switch (job.name) {
              case 'send_notification':
                return await notificationService.processNotificationJob(job.data);
              case 'broadcast_notification':
                // Handle broadcast notifications
                return { success: true, message: 'Broadcast notification processed' };
              default:
                logger.warn('Unknown job type', { jobType: job.name });
                return { success: false, error: 'Unknown job type' };
            }
          } catch (error: any) {
            logger.error('Error processing notification job', {
              jobId: job.id,
              jobType: job.name,
              error: error.message
            });
            throw error;
          }
        },
        redisOptions
      );

      // Create worker for scheduled notification jobs
      const scheduledNotificationWorker = new Worker('scheduled-notifications',
        async (job: Job) => {
          logger.info('Processing scheduled notification job', { jobId: job.id });

          try {
            // Process scheduled notification
            // This would typically create actual notifications and add them to the notification queue
            logger.info('Scheduled notification processed', {
              scheduledNotificationId: job.data.scheduledNotificationId
            });

            return {
              success: true,
              message: 'Scheduled notification processed',
              data: job.data
            };
          } catch (error: any) {
            logger.error('Error processing scheduled notification job', {
              jobId: job.id,
              error: error.message
            });
            throw error;
          }
        },
        redisOptions
      );

      // Handle worker errors
      notificationWorker.on('error', (error: any) => {
        logger.error('Notification worker error', error);
      });

      scheduledNotificationWorker.on('error', (error: any) => {
        logger.error('Scheduled notification worker error', error);
      });

      // Handle job completion
      notificationWorker.on('completed', (job: any) => {
        logger.info('Notification job completed', { jobId: job.id, jobType: job.name });
      });

      scheduledNotificationWorker.on('completed', (job: any) => {
        logger.info('Scheduled notification job completed', { jobId: job.id });
      });

      // Handle job failure
      notificationWorker.on('failed', (job: any, error: any) => {
        logger.error('Notification job failed', {
          jobId: job?.id,
          jobType: job?.name,
          error: error.message
        });
      });

      scheduledNotificationWorker.on('failed', (job: any, error: any) => {
        logger.error('Scheduled notification job failed', {
          jobId: job?.id,
          error: error.message
        });
      });

      return {
        success: true,
        message: 'Notification job processors started'
      };
    } catch (error: any) {
      logger.error('Process notification jobs error', error);
      throw error;
    }
  },

  // Get job status
  getJobStatus: async (queueName: string, jobId: string) => {
    try {
      logger.info('Getting job status', { queueName, jobId });

      let queue: Queue | null = null;
      switch (queueName) {
        case 'notifications':
          queue = notificationQueue;
          break;
        case 'scheduled-notifications':
          queue = scheduledNotificationQueue;
          break;
        default:
          throw new Error('Unknown queue name');
      }

      if (!queue) {
        throw new Error('Queue not initialized');
      }

      const job = await queue.getJob(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      return {
        success: true,
        data: {
          id: job.id,
          name: job.name,
          data: job.data,
          status: await job.getState(),
          attempts: job.attemptsMade,
          progress: job.progress
        }
      };
    } catch (error: any) {
      logger.error('Get job status error', error);
      throw error;
    }
  },

  // Cancel job
  cancelJob: async (queueName: string, jobId: string) => {
    try {
      logger.info('Cancelling job', { queueName, jobId });

      let queue: Queue | null = null;
      switch (queueName) {
        case 'notifications':
          queue = notificationQueue;
          break;
        case 'scheduled-notifications':
          queue = scheduledNotificationQueue;
          break;
        default:
          throw new Error('Unknown queue name');
      }

      if (!queue) {
        throw new Error('Queue not initialized');
      }

      const job = await queue.getJob(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      await job.remove();

      return {
        success: true,
        message: 'Job cancelled successfully'
      };
    } catch (error: any) {
      logger.error('Cancel job error', error);
      throw error;
    }
  },

  // Get queue metrics
  getQueueMetrics: async () => {
    try {
      logger.info('Getting queue metrics');

      if (!notificationQueue || !scheduledNotificationQueue) {
        return {
          success: true,
          data: {
            notifications: { active: 0, completed: 0, failed: 0, delayed: 0, waiting: 0 },
            scheduledNotifications: { active: 0, completed: 0, failed: 0, delayed: 0, waiting: 0 }
          }
        };
      }

      const notificationQueueMetrics = await notificationQueue.getJobCounts();
      const scheduledNotificationQueueMetrics = await scheduledNotificationQueue.getJobCounts();

      return {
        success: true,
        data: {
          notifications: notificationQueueMetrics,
          scheduledNotifications: scheduledNotificationQueueMetrics
        }
      };
    } catch (error: any) {
      logger.error('Get queue metrics error', error);
      throw error;
    }
  }
};