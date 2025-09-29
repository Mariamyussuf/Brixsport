// Notification service implementation
// Provides typed notification helpers and runtime validation via zod.

import { z } from 'zod';
import { APIEndpoint, APIResponse } from '@/types/api';
import type { Match, MatchEvent } from '@/lib/userMatchService';
import type { Team, Competition } from '@/lib/api';
import type { Notification } from '@/components/shared/NotificationsContext';
import { databaseService } from '@/lib/databaseService';

// Zod schemas for runtime validation
export const NotificationTypeSchema = z.enum([
  'match', 'event', 'system', 'update', 'goal', 'assist', 'player',
  'kickoff', 'half-time', 'full-time', 'substitution', 'card',
  'lineup', 'preview', 'result', 'highlight', 'standing', 'qualification',
  'fixture', 'news', 'transfer', 'injury'
]);

export const NotificationCategorySchema = z.enum([
  'match', 'player', 'competition', 'news'
]);

export const NotificationPrioritySchema = z.enum([
  'high', 'normal', 'low'
]);

export const NotificationSoundSchema = z.enum([
  'default', 'success', 'error', 'silent'
]);

export const NotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  timestamp: z.number(),
  isRead: z.boolean(),
  type: NotificationTypeSchema,
  actionId: z.string().optional(),
  sound: NotificationSoundSchema.optional(),
  priority: NotificationPrioritySchema.optional(),
  relatedTeamId: z.string().optional(),
  relatedPlayerId: z.string().optional(),
  relatedCompetitionId: z.string().optional(),
  imageUrl: z.string().url().optional(),
  category: NotificationCategorySchema.optional(),
  scheduledTime: z.number().optional(),
  isPushNotification: z.boolean().optional(),
});

export const NotificationCreateSchema = NotificationSchema.omit({
  id: true,
  timestamp: true,
  isRead: true,
});

export type NotificationCreate = z.infer<typeof NotificationCreateSchema>;

// API endpoints for notifications
const notificationEndpoints = {
  send: {
    url: '/notifications/send',
    method: 'POST',
    transform: (data: unknown) => NotificationSchema.parse(data),
  } as APIEndpoint<Notification>,
  getAll: {
    url: '/notifications',
    method: 'GET',
    transform: (data: unknown[]) => z.array(NotificationSchema).parse(data),
  } as APIEndpoint<Notification[]>,
  markAsRead: (id: string) => ({
    url: `/notifications/${id}/read`,
    method: 'PUT',
    transform: (data: unknown) => NotificationSchema.parse(data),
  }) as APIEndpoint<Notification>,
};

export async function sendNotification(
  payload: NotificationCreate
): Promise<APIResponse<Notification>> {
  // Validate payload against schema before sending
  NotificationCreateSchema.parse(payload);
  
  // For now, return a mock response as this needs backend implementation
  // In a real implementation, this would save to the database service
  return {
    success: true,
    data: {
      id: Date.now().toString(),
      title: payload.title,
      message: payload.message,
      timestamp: Date.now(),
      isRead: false,
      type: payload.type,
      actionId: payload.actionId,
      sound: payload.sound,
      priority: payload.priority,
      relatedTeamId: payload.relatedTeamId,
      relatedPlayerId: payload.relatedPlayerId,
      relatedCompetitionId: payload.relatedCompetitionId,
      imageUrl: payload.imageUrl,
      category: payload.category,
      scheduledTime: payload.scheduledTime,
      isPushNotification: payload.isPushNotification,
    }
  };
}

export function createKickoffNotification(match: Match, minutesBefore: number = 15): NotificationCreate {
  const title = `Kickoff in ${minutesBefore}m`;
  const message = `${match.homeTeam} vs ${match.awayTeam} is starting soon`;
  return NotificationCreateSchema.parse({
    title,
    message,
    type: 'kickoff',
    category: 'match',
    priority: 'high',
    sound: 'default',
  });
}

export function createGoalNotification(event: any, match: Match, player?: any): NotificationCreate {
  const title = `Goal!`;
  const message = `${player?.name ?? 'Player'} scored in ${match.homeTeam} vs ${match.awayTeam}`;
  return NotificationCreateSchema.parse({
    title,
    message,
    type: 'goal',
    category: 'player',
    priority: 'high',
    sound: 'success',
    relatedPlayerId: player?.id,
    relatedTeamId: match.homeTeam, // Using team name as ID since it's a string
  });
}

export function createCardNotification(event: any, match: Match, player?: any): NotificationCreate {
  return NotificationCreateSchema.parse({
    title: 'Card',
    message: `${player?.name ?? 'Player'} received a card`,
    type: 'card',
    category: 'match',
    priority: 'normal',
    relatedPlayerId: player?.id,
    relatedTeamId: match.homeTeam, // Using team name as ID since it's a string
  });
}

export function createSubstitutionNotification(event: any, match: Match, playerOut?: any, playerIn?: any): NotificationCreate {
  return NotificationCreateSchema.parse({
    title: 'Substitution',
    message: `${playerOut?.name ?? 'Player'} → ${playerIn?.name ?? 'Player'}`,
    type: 'substitution',
    category: 'match',
    priority: 'normal',
    relatedTeamId: match.homeTeam, // Using team name as ID since it's a string
  });
}

export function createHalfTimeNotification(match: Match): NotificationCreate {
  return NotificationCreateSchema.parse({
    title: 'Half-time',
    message: `${match.homeTeam} vs ${match.awayTeam} is at half-time`,
    type: 'half-time',
    category: 'match',
    priority: 'normal',
  });
}

export function createFullTimeNotification(match: Match): NotificationCreate {
  return NotificationCreateSchema.parse({
    title: 'Full-time',
    message: `${match.homeTeam} vs ${match.awayTeam} has finished`,
    type: 'full-time',
    category: 'match',
    priority: 'normal',
  });
}

export function createLineupNotification(match: Match): NotificationCreate {
  return NotificationCreateSchema.parse({
    title: 'Lineup',
    message: `${match.homeTeam} vs ${match.awayTeam} lineup announced`,
    type: 'lineup',
    category: 'match',
    priority: 'normal',
  });
}

export function createPreviewNotification(match: Match): NotificationCreate {
  return NotificationCreateSchema.parse({
    title: 'Preview',
    message: `${match.homeTeam} vs ${match.awayTeam} preview available`,
    type: 'preview',
    category: 'match',
    priority: 'low',
  });
}

export function createResultNotification(match: Match): NotificationCreate {
  return NotificationCreateSchema.parse({
    title: 'Result',
    message: `${match.homeTeam} vs ${match.awayTeam} result available`,
    type: 'result',
    category: 'match',
    priority: 'normal',
  });
}

export function createPlayerNotification(
  eventType: z.infer<typeof NotificationTypeSchema>,
  player: any,
  match?: Match,
  additionalInfo?: string
): NotificationCreate {
  return NotificationCreateSchema.parse({
    title: 'Player update',
    message: additionalInfo || `${player?.name ?? 'Player'} update`,
    type: eventType,
    category: 'player',
    priority: 'normal',
    relatedPlayerId: player?.id,
    relatedTeamId: match?.homeTeam, // Using team name as ID since it's a string
  });
}