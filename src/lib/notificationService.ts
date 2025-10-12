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
  'MATCH_UPDATE', 'SCORE_ALERT', 'FAVORITE_TEAM', 'COMPETITION_NEWS', 
  'SYSTEM_ALERT', 'REMINDER', 'ACHIEVEMENT', 'ADMIN_NOTICE', 'LOG_ALERT'
]);

export const NotificationCategorySchema = z.enum([
  'match', 'player', 'competition', 'news'
]);

export const NotificationPrioritySchema = z.enum([
  'LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'
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
  userId: z.string(),
  status: z.enum(['UNREAD', 'READ', 'ARCHIVED', 'DELETED']),
  source: z.enum(['SYSTEM', 'ADMIN', 'USER', 'LOGGER']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const NotificationCreateSchema = NotificationSchema.omit({
  id: true,
  timestamp: true,
  isRead: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  priority: NotificationPrioritySchema.default('NORMAL'),
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
      priority: payload.priority,
      relatedTeamId: payload.relatedTeamId,
      relatedPlayerId: payload.relatedPlayerId,
      relatedCompetitionId: payload.relatedCompetitionId,
      imageUrl: payload.imageUrl,
      category: payload.category,
      scheduledTime: payload.scheduledTime,
      isPushNotification: payload.isPushNotification,
      userId: payload.userId,
      status: 'UNREAD',
      source: payload.source,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as Notification
  };
}

export function createKickoffNotification(match: Match, minutesBefore: number = 15): NotificationCreate {
  const title = `Kickoff in ${minutesBefore}m`;
  const message = `${match.homeTeam} vs ${match.awayTeam} is starting soon`;
  return NotificationCreateSchema.parse({
    title,
    message,
    type: 'REMINDER', // Changed to match the enum
    category: 'match',
    priority: 'HIGH',
    sound: 'default',
    userId: '',
    source: 'SYSTEM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function createGoalNotification(event: any, match: Match, player?: any): NotificationCreate {
  const title = `Goal!`;
  const message = `${player?.name ?? 'Player'} scored in ${match.homeTeam} vs ${match.awayTeam}`;
  return NotificationCreateSchema.parse({
    title,
    message,
    type: 'SCORE_ALERT', // Changed to match the enum
    category: 'player',
    priority: 'HIGH',
    sound: 'success',
    relatedPlayerId: player?.id,
    relatedTeamId: match.homeTeam, // Using team name as ID since it's a string
    userId: '',
    source: 'SYSTEM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function createCardNotification(event: any, match: Match, player?: any): NotificationCreate {
  return NotificationCreateSchema.parse({
    title: 'Card',
    message: `${player?.name ?? 'Player'} received a card`,
    type: 'MATCH_UPDATE', // Changed to match the enum
    category: 'match',
    priority: 'NORMAL',
    relatedPlayerId: player?.id,
    relatedTeamId: match.homeTeam, // Using team name as ID since it's a string
    userId: '',
    source: 'SYSTEM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function createSubstitutionNotification(event: any, match: Match, playerOut?: any, playerIn?: any): NotificationCreate {
  return NotificationCreateSchema.parse({
    title: 'Substitution',
    message: `${playerOut?.name ?? 'Player'} → ${playerIn?.name ?? 'Player'}`,
    type: 'MATCH_UPDATE', // Changed to match the enum
    category: 'match',
    priority: 'NORMAL',
    relatedTeamId: match.homeTeam, // Using team name as ID since it's a string
    userId: '',
    source: 'SYSTEM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function createHalfTimeNotification(match: Match): NotificationCreate {
  return NotificationCreateSchema.parse({
    title: 'Half-time',
    message: `${match.homeTeam} vs ${match.awayTeam} is at half-time`,
    type: 'MATCH_UPDATE', // Changed to match the enum
    category: 'match',
    priority: 'NORMAL',
    userId: '',
    source: 'SYSTEM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function createFullTimeNotification(match: Match): NotificationCreate {
  return NotificationCreateSchema.parse({
    title: 'Full-time',
    message: `${match.homeTeam} vs ${match.awayTeam} has finished`,
    type: 'MATCH_UPDATE', // Changed to match the enum
    category: 'match',
    priority: 'NORMAL',
    userId: '',
    source: 'SYSTEM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function createLineupNotification(match: Match): NotificationCreate {
  return NotificationCreateSchema.parse({
    title: 'Lineup',
    message: `${match.homeTeam} vs ${match.awayTeam} lineup announced`,
    type: 'MATCH_UPDATE', // Changed to match the enum
    category: 'match',
    priority: 'NORMAL',
    userId: '',
    source: 'SYSTEM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function createPreviewNotification(match: Match): NotificationCreate {
  return NotificationCreateSchema.parse({
    title: 'Preview',
    message: `${match.homeTeam} vs ${match.awayTeam} preview available`,
    type: 'MATCH_UPDATE', // Changed to match the enum
    category: 'match',
    priority: 'LOW',
    userId: '',
    source: 'SYSTEM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function createResultNotification(match: Match): NotificationCreate {
  return NotificationCreateSchema.parse({
    title: 'Result',
    message: `${match.homeTeam} vs ${match.awayTeam} result available`,
    type: 'MATCH_UPDATE', // Changed to match the enum
    category: 'match',
    priority: 'NORMAL',
    userId: '',
    source: 'SYSTEM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    type: 'PLAYER', // Changed to match the enum
    category: 'player',
    priority: 'NORMAL',
    relatedPlayerId: player?.id,
    relatedTeamId: match?.homeTeam, // Using team name as ID since it's a string
    userId: '',
    source: 'SYSTEM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
