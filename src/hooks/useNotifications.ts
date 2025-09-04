// Custom hook for handling notifications
// Provides a clean interface for sending different types of sports notifications

import { useCallback } from 'react';
import { useNotifications as useNotificationContext } from '@/components/shared/NotificationsContext';
import * as notificationService from '@/lib/notificationService';
import { Match, Player, Team, Competition } from '@/lib/api';
import { LiveEvent } from '@/lib/api';

export const useSportsNotifications = () => {
  const { addNotification, scheduleNotification } = useNotificationContext();

  // Send a kickoff notification
  const sendKickoffNotification = useCallback((match: Match, minutesBefore?: number) => {
    const notification = notificationService.createKickoffNotification(match, minutesBefore);
    // Schedule the notification for 15 minutes before kickoff
    const kickoffTime = new Date(match.date).getTime();
    const delay = kickoffTime - Date.now() - ((minutesBefore || 15) * 60 * 1000);
    
    if (delay > 0) {
      scheduleNotification(notification, delay);
    } else {
      addNotification(notification);
    }
  }, [addNotification, scheduleNotification]);

  // Send a goal notification
  const sendGoalNotification = useCallback((event: LiveEvent, match: Match, player?: Player) => {
    const notification = notificationService.createGoalNotification(event, match, player);
    addNotification(notification);
  }, [addNotification]);

  // Send a card notification
  const sendCardNotification = useCallback((event: LiveEvent, match: Match, player?: Player) => {
    const notification = notificationService.createCardNotification(event, match, player);
    addNotification(notification);
  }, [addNotification]);

  // Send a substitution notification
  const sendSubstitutionNotification = useCallback((
    event: LiveEvent, 
    match: Match, 
    playerOut?: Player, 
    playerIn?: Player
  ) => {
    const notification = notificationService.createSubstitutionNotification(event, match, playerOut, playerIn);
    addNotification(notification);
  }, [addNotification]);

  // Send a half-time notification
  const sendHalfTimeNotification = useCallback((match: Match) => {
    const notification = notificationService.createHalfTimeNotification(match);
    addNotification(notification);
  }, [addNotification]);

  // Send a full-time notification
  const sendFullTimeNotification = useCallback((match: Match) => {
    const notification = notificationService.createFullTimeNotification(match);
    addNotification(notification);
  }, [addNotification]);

  // Send a lineup notification
  const sendLineupNotification = useCallback((match: Match) => {
    const notification = notificationService.createLineupNotification(match);
    addNotification(notification);
  }, [addNotification]);

  // Send a preview notification
  const sendPreviewNotification = useCallback((match: Match) => {
    const notification = notificationService.createPreviewNotification(match);
    addNotification(notification);
  }, [addNotification]);

  // Send a result notification
  const sendResultNotification = useCallback((match: Match) => {
    const notification = notificationService.createResultNotification(match);
    addNotification(notification);
  }, [addNotification]);

  // Send a player notification
  const sendPlayerNotification = useCallback((
    eventType: 'goal' | 'assist' | 'card' | 'injury' | 'transfer',
    player: Player,
    match?: Match,
    additionalInfo?: string
  ) => {
    const notification = notificationService.createPlayerNotification(eventType, player, match, additionalInfo);
    addNotification(notification);
  }, [addNotification]);

  // Send a standing notification
  const sendStandingNotification = useCallback((competition: Competition) => {
    const notification = notificationService.createStandingNotification(competition);
    addNotification(notification);
  }, [addNotification]);

  // Send a qualification notification
  const sendQualificationNotification = useCallback((team: Team, competition: Competition) => {
    const notification = notificationService.createQualificationNotification(team, competition);
    addNotification(notification);
  }, [addNotification]);

  // Send a fixture notification
  const sendFixtureNotification = useCallback((match: Match, competition: Competition) => {
    const notification = notificationService.createFixtureNotification(match, competition);
    addNotification(notification);
  }, [addNotification]);

  // Send a news notification
  const sendNewsNotification = useCallback((title: string, message: string) => {
    const notification = notificationService.createNewsNotification(title, message);
    addNotification(notification);
  }, [addNotification]);

  return {
    // Notification sending functions
    sendKickoffNotification,
    sendGoalNotification,
    sendCardNotification,
    sendSubstitutionNotification,
    sendHalfTimeNotification,
    sendFullTimeNotification,
    sendLineupNotification,
    sendPreviewNotification,
    sendResultNotification,
    sendPlayerNotification,
    sendStandingNotification,
    sendQualificationNotification,
    sendFixtureNotification,
    sendNewsNotification
  };
};