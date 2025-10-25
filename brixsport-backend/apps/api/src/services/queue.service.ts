import { Queue, Worker, Job } from 'bullmq';
import { logger } from '../utils/logger';
import { notificationService } from './notification.service';
import { redis } from './redis.service';

// Create queues
const notificationQueue = new Queue('notifications', { connection: redis });
const scheduledNotificationQueue = new Queue('scheduled-notifications', { connection: redis });

export const queueService = {
  // Add job to notification queue
  addNotificationJob: async (jobType: string, jobData: any, priority: number = 0) => {
    try {
      logger.info('Adding notification job to queue', { jobType, priority });
      
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
        { connection: redis }
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
        { connection: redis }
      );
      
      // Handle worker errors
      notificationWorker.on('error', (error) => {
        logger.error('Notification worker error', error);
      });
      
      scheduledNotificationWorker.on('error', (error) => {
        logger.error('Scheduled notification worker error', error);
      });
      
      // Handle job completion
      notificationWorker.on('completed', (job) => {
        logger.info('Notification job completed', { jobId: job.id, jobType: job.name });
      });
      
      scheduledNotificationWorker.on('completed', (job) => {
        logger.info('Scheduled notification job completed', { jobId: job.id });
      });
      
      // Handle job failure
      notificationWorker.on('failed', (job, error) => {
        logger.error('Notification job failed', { 
          jobId: job?.id, 
          jobType: job?.name, 
          error: error.message 
        });
      });
      
      scheduledNotificationWorker.on('failed', (job, error) => {
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
      
      let queue: Queue;
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
      
      let queue: Queue;
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