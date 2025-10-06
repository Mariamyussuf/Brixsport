import { logger } from '../utils/logger';
import { websocketService } from '../services/websocket.service';

export const websocketSportController = {
  // Handle sport-specific match join
  handleSportMatchJoin: (socket: any, data: any) => {
    try {
      const { matchId, sport } = data;
      logger.info('User joined sport match room', { socketId: socket.id, matchId, sport });
      socket.join(`sport:${sport}:${matchId}`);
    } catch (error: any) {
      logger.error('Error handling sport match join', error);
    }
  },
  
  // Handle sport-specific match leave
  handleSportMatchLeave: (socket: any, data: any) => {
    try {
      const { matchId, sport } = data;
      logger.info('User left sport match room', { socketId: socket.id, matchId, sport });
      socket.leave(`sport:${sport}:${matchId}`);
    } catch (error: any) {
      logger.error('Error handling sport match leave', error);
    }
  },
  
  // Handle live matches join
  handleLiveMatchesJoin: (socket: any, data: any) => {
    try {
      const { sport } = data || {};
      if (sport) {
        logger.info('User joined live matches room for sport', { socketId: socket.id, sport });
        socket.join(`live:${sport}`);
      } else {
        logger.info('User joined all live matches room', { socketId: socket.id });
        socket.join('live:all');
      }
    } catch (error: any) {
      logger.error('Error handling live matches join', error);
    }
  },
  
  // Handle live matches leave
  handleLiveMatchesLeave: (socket: any, data: any) => {
    try {
      const { sport } = data || {};
      if (sport) {
        logger.info('User left live matches room for sport', { socketId: socket.id, sport });
        socket.leave(`live:${sport}`);
      } else {
        logger.info('User left all live matches room', { socketId: socket.id });
        socket.leave('live:all');
      }
    } catch (error: any) {
      logger.error('Error handling live matches leave', error);
    }
  },
  
  // Emit sport-specific match update
  emitSportMatchUpdate: (matchId: string, sport: string, update: any) => {
    try {
      logger.info('Emitting sport match update', { matchId, sport });
      websocketService.emitToRoom(`sport:${sport}:${matchId}`, 'match:update', update);
    } catch (error: any) {
      logger.error('Error emitting sport match update', error);
    }
  },
  
  // Emit live matches update
  emitLiveMatchesUpdate: (sport: string, matches: any) => {
    try {
      logger.info('Emitting live matches update', { sport });
      // Emit to specific sport room
      websocketService.emitToRoom(`live:${sport}`, 'live:matches:update', matches);
      // Also emit to all live matches room
      websocketService.emitToRoom('live:all', `live:matches:${sport}:update`, matches);
    } catch (error: any) {
      logger.error('Error emitting live matches update', error);
    }
  },
  
  // Emit track event update
  emitTrackEventUpdate: (eventId: string, update: any) => {
    try {
      logger.info('Emitting track event update', { eventId });
      websocketService.emitToRoom(`sport:track:${eventId}`, 'track:event:update', update);
    } catch (error: any) {
      logger.error('Error emitting track event update', error);
    }
  }
};