import { logger } from '../utils/logger';
import { matchSocketHandler } from './match.socket';
import { adminSocketHandler } from './admin.socket';
import { analyticsSocketHandler } from './analytics.socket';
import { Server, Socket } from 'socket.io';

let ioInstance: Server | null = null;

export const initSocket = (io: Server) => {
  logger.info('Initializing Socket.IO handlers');
  
  // Store the IO instance for later use
  ioInstance = io;
  
  io.on('connection', (socket: Socket) => {
    logger.info('New socket connection', { socketId: socket.id });
    
    // Initialize match socket handler
    matchSocketHandler(io, socket);
    
    // Initialize admin socket handler
    adminSocketHandler(io, socket);
    
    // Initialize analytics socket handler
    analyticsSocketHandler(io, socket);
    
    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { socketId: socket.id });
    });
  });
};

export const getIO = () => {
  return ioInstance;
};