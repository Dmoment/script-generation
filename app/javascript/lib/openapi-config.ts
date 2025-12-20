/**
 * OpenAPI Client Configuration
 * 
 * Configures the auto-generated API client with:
 * - Base URL
 * - JWT token authentication via Auth0
 * - Error handling
 * 
 * Note: Token is added dynamically in components using useAuth()
 */

import { OpenAPI } from '../types/generated/core/OpenAPI';
import { getAuthToken } from './authTokenProvider';

// Base configuration
OpenAPI.BASE = '/api';
OpenAPI.WITH_CREDENTIALS = false; // No cookies needed with JWT!
OpenAPI.CREDENTIALS = 'same-origin';

OpenAPI.interceptors.request.use(async (request) => {
  const token = await getAuthToken();
  const headers = new Headers(request.headers ?? {});
  
  // Add Authorization header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // If body is FormData, remove Content-Type header to let browser set it with boundary
  // The browser will automatically set: Content-Type: multipart/form-data; boundary=...
  if (request.body instanceof FormData) {
    headers.delete('Content-Type');
  }

  return {
    ...request,
    headers,
  };
});

// Error interceptor for 401 responses
OpenAPI.interceptors.response.use((response) => {
  if (response.status === 401) {
    // Token invalid or expired, redirect to login
    window.location.href = '/';
  }
  
  return response;
});

export default OpenAPI;

