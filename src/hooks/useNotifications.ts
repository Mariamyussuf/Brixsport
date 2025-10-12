// Custom hook for handling notifications
// Provides a clean interface for sending different types of sports notifications

import { useCallback } from 'react';
import { useNotifications as useNotificationContext } from '@/components/shared/NotificationsContext';
import * as notificationService from '../lib/notificationService';
// Update the import path to the correct relative location
import { Player, Team, Competition, LiveEvent } from '../lib/api';
import type { Match } from '@/lib/userMatchService';
import { NotificationTypeSchema } from '../lib/notificationService';
import { z } from 'zod';

export const useSportsNotifications = () => {
  const { addNotification, scheduleNotification } = useNotificationContext();

  // Send a kickoff notification
  const sendKickoffNotification = useCallback((match: Match, minutesBefore?: number) => {
    const notification = notificationService.createKickoffNotification(match, minutesBefore);
    // Schedule the notification for 15 minutes before kickoff
    const kickoffTime = new Date(match.date).getTime();
    const delay = kickoffTime - Date.now() - ((minutesBefore || 15) * 60 * 1000);
    
    if (delay > 0) {
      scheduleNotification(notification as any, delay);
    } else {
      addNotification(notification as any);
    }
  }, [addNotification, scheduleNotification]);

  // Send a goal notification
  const sendGoalNotification = useCallback((event: LiveEvent, match: Match, player?: Player) => {
    const notification = notificationService.createGoalNotification(event, match, player);
  addNotification(notification as any);
  }, [addNotification]);

  // Send a card notification
  const sendCardNotification = useCallback((event: LiveEvent, match: Match, player?: Player) => {
    const notification = notificationService.createCardNotification(event, match, player);
  addNotification(notification as any);
  }, [addNotification]);

  // Send a substitution notification
  const sendSubstitutionNotification = useCallback((
    event: LiveEvent, 
    match: Match, 
    playerOut?: Player, 
    playerIn?: Player
  ) => {
    const notification = notificationService.createSubstitutionNotification(event, match, playerOut, playerIn);
  addNotification(notification as any);
  }, [addNotification]);

  // Send a half-time notification
  const sendHalfTimeNotification = useCallback((match: Match) => {
    const notification = notificationService.createHalfTimeNotification(match);
  addNotification(notification as any);
  }, [addNotification]);

  // Send a full-time notification
  const sendFullTimeNotification = useCallback((match: Match) => {
    const notification = notificationService.createFullTimeNotification(match);
  addNotification(notification as any);
  }, [addNotification]);

  // Send a lineup notification
  const sendLineupNotification = useCallback((match: Match) => {
    const notification = notificationService.createLineupNotification(match);
  addNotification(notification as any);
  }, [addNotification]);

  // Send a preview notification
  const sendPreviewNotification = useCallback((match: Match) => {
    const notification = notificationService.createPreviewNotification(match);
  addNotification(notification as any);
  }, [addNotification]);

  // Send a result notification
  const sendResultNotification = useCallback((match: Match) => {
    const notification = notificationService.createResultNotification(match);
  addNotification(notification as any);
  }, [addNotification]);

  // Send a player notification
  const sendPlayerNotification = useCallback((
    eventType: 'goal' | 'assist' | 'card' | 'injury' | 'transfer',
    player: Player,
    match?: Match,
    additionalInfo?: string
  ) => {
    // Map the eventType to the correct enum value
    let mappedEventType: z.infer<typeof NotificationTypeSchema>;
    switch (eventType) {
      case 'goal':
        mappedEventType = 'SCORE_ALERT';
        break;
      case 'assist':
        mappedEventType = 'MATCH_UPDATE';
        break;
      case 'card':
        mappedEventType = 'MATCH_UPDATE';
        break;
      case 'injury':
        mappedEventType = 'SYSTEM_ALERT';
        break;
      case 'transfer':
        mappedEventType = 'COMPETITION_NEWS';
        break;
      default:
        mappedEventType = 'MATCH_UPDATE';
    }
    
    const notification = notificationService.createPlayerNotification(mappedEventType, player, match, additionalInfo);
    addNotification(notification as any);
  }, [addNotification]);

  // Send a standing notification
  const sendStandingNotification = useCallback((competition: Competition) => {
    // Create a simple notification since the function doesn't exist in notificationService
    const notification = {
      title: 'Standings Updated',
      message: `Standings for ${competition.name} have been updated`,
      type: 'MATCH_UPDATE' as const,
      category: 'competition' as const,
      priority: 'NORMAL' as const,
    };
    addNotification(notification as any);
  }, [addNotification]);

  // Send a qualification notification
  const sendQualificationNotification = useCallback((team: Team, competition: Competition) => {
    // Create a simple notification since the function doesn't exist in notificationService
    const notification = {
      title: 'Qualification Update',
      message: `${team.name} has qualified in ${competition.name}`,
      type: 'MATCH_UPDATE' as const,
      category: 'competition' as const,
      priority: 'HIGH' as const,
    };
    addNotification(notification as any);
  }, [addNotification]);

  // Send a fixture notification
  const sendFixtureNotification = useCallback((match: Match, competition: Competition) => {
    // Create a simple notification since the function doesn't exist in notificationService
    const notification = {
      title: 'Fixture Update',
      message: `New fixture for ${match.homeTeam} vs ${match.awayTeam} in ${competition.name}`,
      type: 'MATCH_UPDATE' as const,
      category: 'match' as const,
      priority: 'NORMAL' as const,
    };
    addNotification(notification as any);
  }, [addNotification]);

  // Send a news notification
  const sendNewsNotification = useCallback((title: string, message: string) => {
    // Create a simple notification since the function doesn't exist in notificationService
    const notification = {
      title,
      message,
      type: 'SYSTEM_ALERT' as const,
      category: 'news' as const,
      priority: 'NORMAL' as const,
    };
    addNotification(notification as any);
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