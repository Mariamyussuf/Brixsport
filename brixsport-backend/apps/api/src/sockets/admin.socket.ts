import { logger } from '../utils/logger';
import { Server, Socket } from 'socket.io';
import { supabaseService } from '../services/supabase.service';

export const adminSocketHandler = (io: Server, socket: Socket) => {
  logger.info('Admin socket handler initialized', { socketId: socket.id });
  
  // Handle admin join
  socket.on('admin:join', () => {
    logger.info('Admin joined admin room', { socketId: socket.id });
    socket.join('admin');
  });
  
  // Handle admin leave
  socket.on('admin:leave', () => {
    logger.info('Admin left admin room', { socketId: socket.id });
    socket.leave('admin');
  });
  
  // Handle user activity monitoring
  socket.on('admin:monitorUserActivity', async (activity: any) => {
    try {
      logger.info('User activity monitoring event', { activity });
      
      // Store activity in database (optional)
      // This would require a UserActivity table in Supabase
      
      // Broadcast to all admins
      io.to('admin').emit('admin:user_activity', activity);
    } catch (error: any) {
      logger.error('Error handling user activity monitoring', { error: error.message });
    }
  });
  
  // Handle system alerts
  socket.on('admin:systemAlert', async (alert: any) => {
    try {
      logger.info('System alert event', { alert });
      
      // Store alert in database (optional)
      // This would require an Alert table in Supabase
      
      // Broadcast to all admins
      io.to('admin').emit('admin:system_alert', alert);
    } catch (error: any) {
      logger.error('Error handling system alert', { error: error.message });
    }
  });
  
  // Handle logger status updates
  socket.on('admin:loggerStatus', async (status: any) => {
    try {
      logger.info('Logger status update', { status });
      
      // Store logger status in database (optional)
      // This would require a LoggerStatus table in Supabase
      
      // Broadcast to all admins
      io.to('admin').emit('admin:logger_status', status);
    } catch (error: any) {
      logger.error('Error handling logger status update', { error: error.message });
    }
  });
  
  // Handle user management actions
  socket.on('admin:userAction', async (data: any) => {
    try {
      const { action, userId, userData } = data;
      logger.info('User management action', { action, userId });
      
      let result;
      
      switch (action) {
        case 'create':
          result = await supabaseService.createUser(userData);
          break;
        case 'update':
          result = await supabaseService.updateUser(userId, userData);
          break;
        case 'delete':
          // For safety, we don't actually delete users, just mark them as inactive
          result = await supabaseService.updateUser(userId, { isActive: false });
          break;
        default:
          logger.warn('Unknown user action', { action });
          return;
      }
      
      // Broadcast result to all admins
      io.to('admin').emit('admin:userActionResult', {
        action,
        userId,
        success: result ? true : false,
        data: result
      });
    } catch (error: any) {
      logger.error('Error handling user management action', { error: error.message });
      io.to('admin').emit('admin:userActionError', {
        error: error.message
      });
    }
  });
  
  // Handle competition management actions
  socket.on('admin:competitionAction', async (data: any) => {
    try {
      const { action, competitionId, competitionData } = data;
      logger.info('Competition management action', { action, competitionId });
      
      let result;
      
      switch (action) {
        case 'create':
          result = await supabaseService.createCompetition(competitionData);
          break;
        case 'update':
          result = await supabaseService.updateCompetition(competitionId, competitionData);
          break;
        case 'delete':
          result = await supabaseService.deleteCompetition(competitionId);
          break;
        default:
          logger.warn('Unknown competition action', { action });
          return;
      }
      
      // Broadcast result to all admins
      io.to('admin').emit('admin:competitionActionResult', {
        action,
        competitionId,
        success: result.success,
        data: result.data
      });
    } catch (error: any) {
      logger.error('Error handling competition management action', { error: error.message });
      io.to('admin').emit('admin:competitionActionError', {
        error: error.message
      });
    }
  });
  
  // Handle team management actions
  socket.on('admin:teamAction', async (data: any) => {
    try {
      const { action, teamId, teamData } = data;
      logger.info('Team management action', { action, teamId });
      
      let result;
      
      switch (action) {
        case 'create':
          result = await supabaseService.createTeam(teamData);
          break;
        case 'update':
          result = await supabaseService.updateTeam(teamId, teamData);
          break;
        case 'delete':
          result = await supabaseService.deleteTeam(teamId);
          break;
        default:
          logger.warn('Unknown team action', { action });
          return;
      }
      
      // Broadcast result to all admins
      io.to('admin').emit('admin:teamActionResult', {
        action,
        teamId,
        success: result.success,
        data: result.data
      });
    } catch (error: any) {
      logger.error('Error handling team management action', { error: error.message });
      io.to('admin').emit('admin:teamActionError', {
        error: error.message
      });
    }
  });
  
  // Handle match management actions
  socket.on('admin:matchAction', async (data: any) => {
    try {
      const { action, matchId, matchData } = data;
      logger.info('Match management action', { action, matchId });
      
      let result;
      
      switch (action) {
        case 'create':
          result = await supabaseService.createMatch(matchData);
          break;
        case 'update':
          result = await supabaseService.updateMatch(matchId, matchData);
          break;
        case 'delete':
          result = await supabaseService.deleteMatch(matchId);
          break;
        default:
          logger.warn('Unknown match action', { action });
          return;
      }
      
      // Broadcast result to all admins
      io.to('admin').emit('admin:matchActionResult', {
        action,
        matchId,
        success: result.success,
        data: result.data
      });
    } catch (error: any) {
      logger.error('Error handling match management action', { error: error.message });
      io.to('admin').emit('admin:matchActionError', {
        error: error.message
      });
    }
  });
};