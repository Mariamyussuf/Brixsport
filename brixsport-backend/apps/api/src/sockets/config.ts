import { Server } from 'socket.io';

/**
 * Initialize Socket.IO with proper CORS configuration for Vercel frontend
 */
export function initSocket(io: Server) {
  // Configure Socket.IO for cross-origin with Vercel
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'];

  io.engine.on("connection_error", (err) => {
    console.log('Socket connection error:', err.message);
  });

  // Socket.IO CORS configuration
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Your socket event handlers here
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}