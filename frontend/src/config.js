/**
 * API Configuration
 * Uses Vite environment variables for local and production
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API = {
  BASE_URL: API_BASE_URL,
  
  // Endpoints
  STATUS: `${API_BASE_URL}/api/status`,
  INGEST: `${API_BASE_URL}/api/ingest`,
  CHUNKS: `${API_BASE_URL}/api/chunks`,
  CHAT: `${API_BASE_URL}/api/chat`,
};

export default API;
