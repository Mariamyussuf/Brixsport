// Notification service implementation
// Provides typed notification helpers and runtime validation via zod.

import { z } from 'zod';
import APIService from '@/services/APIService';
import { APIEndpoint, APIResponse } from '@/types/api';
import type { Match, MatchEvent } from '@/lib/userMatchService';
import type { Team, Competition } from '@/lib/api';
import type { Notification } from '@/components/shared/NotificationsContext';

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
  return APIService.request(notificationEndpoints.send, payload);
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

export function createStandingNotification(competition: Competition): NotificationCreate {
  return NotificationCreateSchema.parse({
    title: 'Standings',
    message: `${competition?.name ?? 'Competition'} standings updated`,
    type: 'standing',
    category: 'competition',
    priority: 'normal',
    relatedCompetitionId: competition?.id,
  });
}

export function createQualificationNotification(team: Team, competition: Competition): NotificationCreate {
  return NotificationCreateSchema.parse({
    title: 'Qualification',
    message: `${team?.name ?? 'Team'} qualification update for ${competition?.name ?? 'competition'}`,
    type: 'qualification',
    category: 'competition',
    priority: 'high',
    relatedTeamId: team?.id,
    relatedCompetitionId: competition?.id,
  });
}

export function createFixtureNotification(match: Match, competition: Competition): NotificationCreate {
  return NotificationCreateSchema.parse({
    title: 'Fixture',
    message: `${match.homeTeam} vs ${match.awayTeam} fixture update`,
    type: 'fixture',
    category: 'match',
    priority: 'normal',
    relatedCompetitionId: competition?.id,
  });
}

export function createNewsNotification(title: string, msg: string): NotificationCreate {
  return NotificationCreateSchema.parse({
    title,
    message: msg,
    type: 'news',
    category: 'news',
    priority: 'low',
  });
}

const notificationService = {
  sendNotification,
  createKickoffNotification,
  createGoalNotification,
  createCardNotification,
  createSubstitutionNotification,
  createHalfTimeNotification,
  createFullTimeNotification,
  createLineupNotification,
  createPreviewNotification,
  createResultNotification,
  createPlayerNotification,
  createStandingNotification,
  createQualificationNotification,
  createFixtureNotification,
  createNewsNotification,
};

export { notificationService as default };
