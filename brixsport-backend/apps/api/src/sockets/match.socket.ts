import { logger } from '../utils/logger';
import { Server, Socket } from 'socket.io';
import { supabaseService } from '../services/supabase.service';
import { Match } from '../types/team.types';


interface EnrichedMatch extends Match {
  home_team_name?: string;
  away_team_name?: string;
  competition_name?: string;
  home_team_logo?: string;
  away_team_logo?: string;
  competition_id?: string;
  match_date?: Date;
  home_score?: number;
  away_score?: number;
  current_minute?: number;
  period?: string;
}

export const matchSocketHandler = (io: Server, socket: Socket) => {
  logger.info('Match socket handler initialized', { socketId: socket.id });
  
  // Handle match join
  socket.on('match:join', async (matchId: string) => {
    try {
      logger.info('User joined match room', { socketId: socket.id, matchId });
      socket.join(`match:${matchId}`);
      
      // Get current match state and send to user
      const matchResult = await supabaseService.getMatch(matchId);
      if (matchResult.success) {
        socket.emit('match:state', matchResult.data);
      }
    } catch (error: any) {
      logger.error('Error joining match room', { error: error.message, matchId });
    }
  });
  
  // Handle match leave
  socket.on('match:leave', (matchId: string) => {
    logger.info('User left match room', { socketId: socket.id, matchId });
    socket.leave(`match:${matchId}`);
  });
  
  // Handle match state update (for match loggers/reporters)
  socket.on('match:updateState', async (data: any) => {
    try {
      const { matchId, state } = data;
      logger.info('Match state update received', { matchId, state });
      
      // Update match state in database
      const updateResult = await supabaseService.updateMatch(matchId, state);
      if (updateResult.success) {
        // Broadcast to all users in match room
        io.to(`match:${matchId}`).emit('match:state', updateResult.data);
      }
    } catch (error: any) {
      logger.error('Error updating match state', { error: error.message });
    }
  });
  
  // Handle match event (for match loggers/reporters)
  socket.on('match:addEvent', async (data: any) => {
    try {
      const { matchId, event } = data;
      logger.info('Match event received', { matchId, event });
      
      // Store event in database
      const eventResult = await supabaseService.createMatchEvent({
        matchId,
        ...event
      });
      
      if (eventResult.success) {
        // Broadcast to all users in match room
        io.to(`match:${matchId}`).emit('match:event', eventResult.data);
      }
    } catch (error: any) {
      logger.error('Error adding match event', { error: error.message });
    }
  });
  
  // Handle match commentary (for match loggers/reporters)
  socket.on('match:addCommentary', async (data: any) => {
    try {
      const { matchId, commentary } = data;
      logger.info('Match commentary received', { matchId, commentary });
      
      // Store commentary in database (would need a Commentary table)
      // For now, we'll just broadcast it
      io.to(`match:${matchId}`).emit('match:commentary', commentary);
    } catch (error: any) {
      logger.error('Error adding match commentary', { error: error.message });
    }
  });
  
  // Handle match stats update (for match loggers/reporters)
  socket.on('match:updateStats', async (data: any) => {
    try {
      const { matchId, stats } = data;
      logger.info('Match stats update received', { matchId, stats });
      
      // Update match stats in database
      const updateResult = await supabaseService.updateMatch(matchId, { stats });
      if (updateResult.success) {
        // Broadcast to all users in match room
        io.to(`match:${matchId}`).emit('match:stats', stats);
      }
    } catch (error: any) {
      logger.error('Error updating match stats', { error: error.message });
    }
  });
  
  // Handle live score updates
  socket.on('match:updateScore', async (data: any) => {
    try {
      const { matchId, homeScore, awayScore, currentMinute, period } = data;
      logger.info('Match score update received', { matchId, homeScore, awayScore });
      
      // Update match score in database
      const updateResult = await supabaseService.updateMatch(matchId, {
        homeScore,
        awayScore,
        currentMinute,
        period
      });
      
      if (updateResult.success) {
        // Broadcast to all users in match room and live matches rooms
        const scoreUpdate = {
          matchId,
          homeScore,
          awayScore,
          currentMinute,
          period,
          timestamp: new Date()
        };
        
        io.to(`match:${matchId}`).emit('match:scoreUpdate', scoreUpdate);
        
        // Also broadcast to live matches rooms
        const matchResult = await supabaseService.getMatch(matchId);
        if (matchResult.success) {
          const match = matchResult.data as EnrichedMatch;
          io.to(`live:${match.competition_name}`).emit('live:scoreUpdate', scoreUpdate);
          io.to('live:all').emit('live:scoreUpdate', scoreUpdate);
        }
      }
    } catch (error: any) {
      logger.error('Error updating match score', { error: error.message });
    }
  });
  
  // Handle match status update (started, finished, etc.)
  socket.on('match:updateStatus', async (data: any) => {
    try {
      const { matchId, status } = data;
      logger.info('Match status update received', { matchId, status });
      
      // Update match status in database
      const updateResult = await supabaseService.updateMatch(matchId, { status });
      if (updateResult.success) {
        // Broadcast to all users in match room and live matches rooms
        const statusUpdate = {
          matchId,
          status,
          timestamp: new Date()
        };
        
        io.to(`match:${matchId}`).emit('match:statusUpdate', statusUpdate);
        
        // Also broadcast to live matches rooms
        const matchResult = await supabaseService.getMatch(matchId);
        if (matchResult.success) {
          const match = matchResult.data as EnrichedMatch;
          io.to(`live:${match.competition_name}`).emit('live:statusUpdate', statusUpdate);
          io.to('live:all').emit('live:statusUpdate', statusUpdate);
        }
      }
    } catch (error: any) {
      logger.error('Error updating match status', { error: error.message });
    }
  });
};