
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// API Version
export const API_VERSION = 'v1';

// Other API settings
export const API_TIMEOUT = 15000; // 15 seconds timeout

export default {
  baseUrl: API_BASE_URL,
  version: API_VERSION,
  timeout: API_TIMEOUT,
};