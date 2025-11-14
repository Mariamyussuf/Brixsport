// API and Socket configuration for Vercel frontend
// This file handles the configuration for connecting to the Railway backend

/**
 * API Base URL Configuration
 * Uses environment variables when available, with fallbacks for different environments
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://brixsport-backend-again-production.up.railway.app' 
    : 'http://localhost:4000');

/**
 * Socket.IO URL Configuration
 * Uses environment variables when available, with fallbacks for different environments
 */
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://brixsport-backend-again-production.up.railway.app' 
    : 'http://localhost:4000');

export default {
  API_URL,
  SOCKET_URL
};