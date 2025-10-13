import { logger } from '../utils/logger';
import { supabaseService } from './supabase.service';

class SystemMonitorService {
  private monitorInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  /**
   * Start monitoring system flags including restart requests
   */
  startMonitoring() {
    if (this.isMonitoring) {
      logger.warn('System monitor is already running');
      return;
    }

    this.isMonitoring = true;
    logger.info('Starting system monitor service');

    // Check for system flags every 30 seconds
    this.monitorInterval = setInterval(async () => {
      try {
        await this.checkRestartFlag();
      } catch (error) {
        logger.error('Error in system monitor check', error);
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop monitoring system flags
   */
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      this.isMonitoring = false;
      logger.info('System monitor service stopped');
    }
  }

  /**
   * Check if a service restart has been requested
   */
  private async checkRestartFlag() {
    try {
      const restartRequested = await supabaseService.getSystemSetting('service_restart_requested');
      
      if (restartRequested === true) {
        logger.info('Service restart requested, initiating restart sequence');
        
        // Update status to indicate we're processing the restart
        await supabaseService.setSystemSetting('service_restart_status', 'processing');
        
        // Add a small delay to allow the response to be sent
        setTimeout(() => {
          this.handleRestart();
        }, 1000);
      }
    } catch (error) {
      logger.error('Error checking restart flag', error);
    }
  }

  /**
   * Handle the actual restart process
   */
  private async handleRestart() {
    try {
      logger.info('Executing service restart');
      
      // Log the restart event
      await supabaseService.createAuditLog({
        userId: 'system',
        action: 'service_restart_executed',
        entity: 'System',
        entityId: 'system',
        oldValues: null,
        newValues: { status: 'restart_completed' },
        reason: 'Service restart executed by system monitor',
        timestamp: new Date()
      });
      
      // Update restart status
      await supabaseService.setSystemSetting('service_restart_status', 'completed');
      
      // In a real implementation, this would trigger the actual restart
      // For example, with PM2: process.exit(0);
      // Or with Kubernetes: send a signal to the process manager
      
      logger.info('Service restart completed - in production this would exit the process');
      
      // For demonstration purposes, we're not actually exiting the process
      // In a real application, you would uncomment the next line:
      // process.exit(0);
    } catch (error) {
      logger.error('Error handling restart', error);
      
      // Record the failure
      try {
        await supabaseService.setSystemSetting('service_restart_status', 'failed');
        await supabaseService.setSystemSetting('service_restart_error', (error as Error).message);
      } catch (recordingError) {
        logger.error('Failed to record restart failure', recordingError);
      }
    }
  }

  /**
   * Get current monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      interval: this.monitorInterval ? 'Active' : 'Inactive'
    };
  }
}

// Export a singleton instance
export const systemMonitorService = new SystemMonitorService();