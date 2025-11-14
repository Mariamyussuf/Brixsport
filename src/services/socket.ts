import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

// Store socket instance
let socket: Socket | null = null;

/**
 * Get socket instance
 * Creates a new socket connection if one doesn't exist
 */
export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      withCredentials: true,
    });
  }
  
  return socket;
};

/**
 * Connect to socket
 * Connects if not already connected
 */
export const connectSocket = (): void => {
  const socketInstance = getSocket();
  if (!socketInstance.connected) {
    socketInstance.connect();
  }
};

/**
 * Disconnect from socket
 * Disconnects if connected
 */
export const disconnectSocket = (): void => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};

/**
 * Emit an event to the server
 */
export const emit = (event: string, data?: any): void => {
  const socketInstance = getSocket();
  socketInstance.emit(event, data);
};

/**
 * Listen for an event from the server
 */
export const on = (event: string, callback: (...args: any[]) => void): void => {
  const socketInstance = getSocket();
  socketInstance.on(event, callback);
};

/**
 * Remove listener for an event
 */
export const off = (event: string, callback?: (...args: any[]) => void): void => {
  const socketInstance = getSocket();
  if (callback) {
    socketInstance.off(event, callback);
  } else {
    socketInstance.off(event);
  }
};

export default {
  getSocket,
  connectSocket,
  disconnectSocket,
  emit,
  on,
  off
};