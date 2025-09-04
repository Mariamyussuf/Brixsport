// Notification Service
// Handles the creation and delivery of different types of sports notifications

import { Match, Player, Team, Competition } from './api';
import { LiveEvent } from './api';

// Types of notifications we can send
export type NotificationType = 
  | 'kickoff'        // Match is about to start
  | 'goal'           // Goal scored
  | 'card'           // Yellow/Red card
  | 'substitution'   // Player substitution
  | 'half-time'      // Half time reached
  | 'full-time'      // Match ended
  | 'extra-time'     // Extra time started
  | 'penalty'        // Penalty shootout
  | 'lineup'         // Lineups announced
  | 'preview'        // Match preview
  | 'result'         // Final result
  | 'highlight'      // Highlights available
  | 'standing'       // Standings updated
  | 'qualification'  // Team qualified
  | 'fixture'        // New fixture
  | 'player'         // Player-specific events
  | 'news'           // Breaking news
  | 'transfer'       // Transfer news
  | 'injury'         // Player injury
  | 'update';        // General updates

// Notification priority levels
export type NotificationPriority = 'low' | 'normal' | 'high';

// Create a notification for a match kickoff
export const createKickoffNotification = (
  match: Match,
  minutesBefore: number = 15
) => {
  // This would typically integrate with the notification context
  // For now, we'll just return the notification data
  return {
    title: 'Match Starting Soon',
    message: `${match.homeTeam} vs ${match.awayTeam} is about to begin!`,
    type: 'kickoff' as const,
    category: 'match' as const,
    actionId: match.id,
    relatedTeamId: match.homeTeam, // Simplified for now
    priority: 'high' as const,
    sound: 'default' as const
  };
};

// Create a notification for a goal
export const createGoalNotification = (
  event: LiveEvent,
  match: Match,
  player?: Player
) => {
  const playerName = player ? player.name : 'A player';
  const teamName = event.teamId === match.homeTeam ? match.homeTeam : match.awayTeam;
  
  return {
    title: 'GOAL!',
    message: `${playerName} scores for ${teamName}!`,
    type: 'goal' as const,
    category: 'match' as const,
    actionId: match.id,
    relatedTeamId: event.teamId,
    relatedPlayerId: player?.id,
    priority: 'high' as const,
    sound: 'success' as const
  };
};

// Create a notification for a card
export const createCardNotification = (
  event: LiveEvent,
  match: Match,
  player?: Player
) => {
  const cardType = event.type.includes('yellow') ? 'Yellow Card' : 'Red Card';
  const playerName = player ? player.name : 'A player';
  const teamName = event.teamId === match.homeTeam ? match.homeTeam : match.awayTeam;
  
  return {
    title: cardType,
    message: `${playerName} (${teamName}) received a ${cardType.toLowerCase()}`,
    type: 'card' as const,
    category: 'match' as const,
    actionId: match.id,
    relatedTeamId: event.teamId,
    relatedPlayerId: player?.id,
    priority: cardType.includes('Red') ? 'high' as const : 'normal' as const,
    sound: cardType.includes('Red') ? 'error' as const : 'default' as const
  };
};

// Create a notification for a substitution
export const createSubstitutionNotification = (
  event: LiveEvent,
  match: Match,
  playerOut?: Player,
  playerIn?: Player
) => {
  const teamName = event.teamId === match.homeTeam ? match.homeTeam : match.awayTeam;
  
  return {
    title: 'Substitution',
    message: `${playerOut?.name || 'A player'} is substituted by ${playerIn?.name || 'a player'} for ${teamName}`,
    type: 'substitution' as const,
    category: 'match' as const,
    actionId: match.id,
    relatedTeamId: event.teamId,
    priority: 'normal' as const
  };
};

// Create a notification for half-time
export const createHalfTimeNotification = (match: Match) => {
  return {
    title: 'Half Time',
    message: `${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`,
    type: 'half-time' as const,
    category: 'match' as const,
    actionId: match.id,
    priority: 'normal' as const
  };
};

// Create a notification for full-time
export const createFullTimeNotification = (match: Match) => {
  return {
    title: 'Full Time',
    message: `Final score: ${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`,
    type: 'full-time' as const,
    category: 'match' as const,
    actionId: match.id,
    priority: 'normal' as const
  };
};

// Create a notification for lineups announced
export const createLineupNotification = (match: Match) => {
  return {
    title: 'Lineups Announced',
    message: `Starting lineups for ${match.homeTeam} vs ${match.awayTeam} have been announced`,
    type: 'lineup' as const,
    category: 'match' as const,
    actionId: match.id,
    priority: 'normal' as const
  };
};

// Create a notification for match preview
export const createPreviewNotification = (match: Match) => {
  return {
    title: 'Match Preview',
    message: `Preview: ${match.homeTeam} vs ${match.awayTeam} - Check out the form and head-to-head stats`,
    type: 'preview' as const,
    category: 'match' as const,
    actionId: match.id,
    priority: 'normal' as const
  };
};

// Create a notification for match result
export const createResultNotification = (match: Match) => {
  const result = match.homeScore > match.awayScore 
    ? `${match.homeTeam} wins` 
    : match.awayScore > match.homeScore 
    ? `${match.awayTeam} wins` 
    : 'It\'s a draw';
    
  return {
    title: 'Match Result',
    message: `Final: ${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}. ${result}!`,
    type: 'result' as const,
    category: 'match' as const,
    actionId: match.id,
    priority: 'normal' as const
  };
};

// Create a notification for player-specific events
export const createPlayerNotification = (
  eventType: 'goal' | 'assist' | 'card' | 'injury' | 'transfer',
  player: Player,
  match?: Match,
  additionalInfo?: string
) => {
  let title = '';
  let message = '';
  
  switch (eventType) {
    case 'goal':
      title = 'Goal!';
      message = `${player.name} scores a goal${match ? ` in ${match.homeTeam} vs ${match.awayTeam}` : ''}!`;
      break;
    case 'assist':
      title = 'Assist!';
      message = `${player.name} provides an assist${match ? ` in ${match.homeTeam} vs ${match.awayTeam}` : ''}!`;
      break;
    case 'card':
      title = 'Booking';
      message = `${player.name} received a card${match ? ` in ${match.homeTeam} vs ${match.awayTeam}` : ''}.`;
      break;
    case 'injury':
      title = 'Injury Report';
      message = `${player.name} has been injured${additionalInfo ? `: ${additionalInfo}` : ''}.`;
      break;
    case 'transfer':
      title = 'Transfer News';
      message = `${player.name} ${additionalInfo || 'has made a transfer'}.`;
      break;
  }
  
  return {
    title,
    message,
    type: 'player' as const,
    category: 'player' as const,
    actionId: player.id,
    relatedPlayerId: player.id,
    priority: eventType === 'injury' || eventType === 'transfer' ? 'high' as const : 'normal' as const,
    sound: eventType === 'goal' ? 'success' as const : eventType === 'injury' ? 'error' as const : 'default' as const
  };
};

// Create a notification for competition standings
export const createStandingNotification = (competition: Competition) => {
  return {
    title: 'Standings Update',
    message: `Latest standings for ${competition.name} are now available`,
    type: 'standing' as const,
    category: 'competition' as const,
    actionId: competition.id,
    relatedCompetitionId: competition.id,
    priority: 'normal' as const
  };
};

// Create a notification for qualification
export const createQualificationNotification = (team: Team, competition: Competition) => {
  return {
    title: 'Qualification Alert',
    message: `${team.name} has qualified for the next stage of ${competition.name}!`,
    type: 'qualification' as const,
    category: 'competition' as const,
    relatedTeamId: team.id,
    relatedCompetitionId: competition.id,
    priority: 'high' as const,
    sound: 'success' as const
  };
};

// Create a notification for new fixtures
export const createFixtureNotification = (match: Match, competition: Competition) => {
  return {
    title: 'New Fixture',
    message: `New match scheduled: ${match.homeTeam} vs ${match.awayTeam} in ${competition.name}`,
    type: 'fixture' as const,
    category: 'match' as const,
    actionId: match.id,
    relatedCompetitionId: competition.id,
    priority: 'normal' as const
  };
};

// Create a notification for breaking news
export const createNewsNotification = (title: string, message: string) => {
  return {
    title,
    message,
    type: 'news' as const,
    category: 'news' as const,
    priority: 'high' as const,
    sound: 'default' as const
  };
};