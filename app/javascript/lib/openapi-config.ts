/**
 * OpenAPI Client Configuration
 * 
 * Configures the auto-generated API client with:
 * - Base URL
 * - CSRF token handling for Rails
 * - Credentials/cookies
 * - Error handling
 */

import { OpenAPI } from '../types/generated/core/OpenAPI';
import { getCsrfToken } from '../utils/csrf';

// Base configuration
// Use empty string to make requests relative to current origin
OpenAPI.BASE = '';
OpenAPI.WITH_CREDENTIALS = true;
OpenAPI.CREDENTIALS = 'same-origin';

// CSRF token interceptor for Rails
// Automatically adds CSRF token to all non-GET requests
OpenAPI.interceptors.request.use((request) => {
  const method = request.method?.toUpperCase();
  
  // Add CSRF token for non-GET requests (Rails requirement)
  if (method && method !== 'GET' && method !== 'HEAD') {
    const token = getCsrfToken();
    if (token) {
      request.headers = {
        ...request.headers,
        'X-CSRF-Token': token,
      };
    }
  }
  
  return request;
});

// Error interceptor
// Handles CSRF token expiration and other errors
OpenAPI.interceptors.response.use((response) => {
  // Handle 403 CSRF errors by reloading the page
  if (response.status === 403) {
    const contentType = response.headers.get('Content-Type');
    if (contentType?.includes('text/html')) {
      console.error('CSRF token invalid or session expired. Reloading page...');
      window.location.reload();
    }
  }
  
  return response;
});

export default OpenAPI;

