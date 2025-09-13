// Custom hook for handling logger-specific notifications
// Extends the existing notification system with logger-specific functionality

import { useCallback } from 'react';
import { useNotifications } from '@/components/shared/NotificationsContext';
import { LoggerMatch, MatchEvent } from '@/lib/loggerService';

export const useLoggerNotifications = () => {
  const { addNotification } = useNotifications();

  // Send a match start notification
  const sendMatchStartNotification = useCallback((match: LoggerMatch) => {
    const notification = {
      title: 'Match Started',
      message: `${match.homeTeamId} vs ${match.awayTeamId} has started!`,
      type: 'kickoff' as const,
      category: 'match' as const,
      actionId: match.id,
      priority: 'high' as const,
      sound: 'default' as const
    };
    
    addNotification(notification);
  }, [addNotification]);

  // Send a match finish notification
  const sendMatchFinishNotification = useCallback((match: LoggerMatch) => {
    const notification = {
      title: 'Match Completed',
      message: `${match.homeTeamId} vs ${match.awayTeamId} has finished! Final score: ${match.homeScore || 0}-${match.awayScore || 0}`,
      type: 'full-time' as const,
      category: 'match' as const,
      actionId: match.id,
      priority: 'high' as const,
      sound: 'success' as const
    };
    
    addNotification(notification);
  }, [addNotification]);

  // Send an event added notification
  const sendEventAddedNotification = useCallback((event: MatchEvent, match: LoggerMatch) => {
    let title = 'Event Logged';
    let message = `New event added to ${match.homeTeamId} vs ${match.awayTeamId}`;
    
    switch (event.type) {
      case 'goal':
        title = 'Goal Logged!';
        message = `Goal logged in ${match.homeTeamId} vs ${match.awayTeamId} at ${event.minute}'`;
        break;
      case 'card':
        title = event.metadata.cardType === 'yellow' ? 'Yellow Card' : 'Red Card';
        message = `${title} logged in ${match.homeTeamId} vs ${match.awayTeamId} at ${event.minute}'`;
        break;
      case 'substitution':
        title = 'Substitution';
        message = `Substitution logged in ${match.homeTeamId} vs ${match.awayTeamId} at ${event.minute}'`;
        break;
      case 'injury':
        title = 'Injury Reported';
        message = `Injury reported in ${match.homeTeamId} vs ${match.awayTeamId} at ${event.minute}'`;
        break;
      default:
        title = 'Event Logged';
        message = `${event.type} event logged in ${match.homeTeamId} vs ${match.awayTeamId} at ${event.minute}'`;
    }
    
    const notification = {
      title,
      message,
      type: event.type as any,
      category: 'match' as const,
      actionId: match.id,
      priority: 'normal' as const,
      sound: 'default' as const
    };
    
    addNotification(notification);
  }, [addNotification]);

  // Send sync success notification
  const sendSyncSuccessNotification = useCallback((itemsSynced: number) => {
    const notification = {
      title: 'Sync Complete',
      message: `Successfully synced ${itemsSynced} item${itemsSynced !== 1 ? 's' : ''} to the server`,
      type: 'system' as const,
      category: 'match' as const,
      priority: 'normal' as const,
      sound: 'success' as const
    };
    
    addNotification(notification);
  }, [addNotification]);

  // Send sync error notification
  const sendSyncErrorNotification = useCallback((error: string) => {
    const notification = {
      title: 'Sync Failed',
      message: `Failed to sync data: ${error}. Data will be retried when connection is restored.`,
      type: 'system' as const,
      category: 'match' as const,
      priority: 'high' as const,
      sound: 'error' as const
    };
    
    addNotification(notification);
  }, [addNotification]);

  // Send offline status notification
  const sendOfflineStatusNotification = useCallback(() => {
    const notification = {
      title: 'Offline Mode',
      message: 'You are currently offline. Events will be saved locally and synced when connection is restored.',
      type: 'system' as const,
      category: 'match' as const,
      priority: 'normal' as const,
      sound: 'silent' as const
    };
    
    addNotification(notification);
  }, [addNotification]);

  // Send online status notification
  const sendOnlineStatusNotification = useCallback(() => {
    const notification = {
      title: 'Online Mode',
      message: 'Connection restored. Pending events will be synced automatically.',
      type: 'system' as const,
      category: 'match' as const,
      priority: 'normal' as const,
      sound: 'success' as const
    };
    
    addNotification(notification);
  }, [addNotification]);

  // Send competition assigned notification
  const sendCompetitionAssignedNotification = useCallback((competitionName: string) => {
    const notification = {
      title: 'New Competition Assigned',
      message: `You have been assigned to log events for ${competitionName}`,
      type: 'system' as const,
      category: 'match' as const,
      priority: 'normal' as const,
      sound: 'default' as const
    };
    
    addNotification(notification);
  }, [addNotification]);

  return {
    // Notification sending functions
    sendMatchStartNotification,
    sendMatchFinishNotification,
    sendEventAddedNotification,
    sendSyncSuccessNotification,
    sendSyncErrorNotification,
    sendOfflineStatusNotification,
    sendOnlineStatusNotification,
    sendCompetitionAssignedNotification
  };
};