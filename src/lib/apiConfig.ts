// API Configuration

// Different environment API URLs
const environments = {
  development: 'http://localhost:3000/api',
  staging: 'https://staging-api.brixsports.com/api',
  production: 'https://api.brixsports.com/api',
};

// Determine current environment
// Default to development in case process.env is undefined or not properly set
const getCurrentEnvironment = (): 'development' | 'staging' | 'production' => {
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
    if (process.env.NODE_ENV === 'production') {
      // Check if it's staging or production
      return process.env.NEXT_PUBLIC_STAGE === 'staging' ? 'staging' : 'production';
    }
  }
  return 'development';
};

// Get the appropriate API URL based on environment
export const API_BASE_URL = environments[getCurrentEnvironment()];

// API Version
export const API_VERSION = 'v1';

// Other API settings
export const API_TIMEOUT = 15000; // 15 seconds timeout

export default {
  baseUrl: API_BASE_URL,
  version: API_VERSION,
  timeout: API_TIMEOUT,
};