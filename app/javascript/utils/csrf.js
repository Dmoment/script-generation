/**
 * CSRF Token Utility for Rails + React
 * 
 * Rails includes CSRF token in meta tags:
 * <meta name="csrf-token" content="..." />
 * 
 * This utility extracts and includes the token in fetch requests
 */

/**
 * Get CSRF token from meta tag
 * @returns {string|null} CSRF token or null if not found
 */
export const getCsrfToken = () => {
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  return metaTag ? metaTag.getAttribute('content') : null;
};

/**
 * Get CSRF param name from meta tag
 * @returns {string} CSRF param name (default: 'authenticity_token')
 */
export const getCsrfParam = () => {
  const metaTag = document.querySelector('meta[name="csrf-param"]');
  return metaTag ? metaTag.getAttribute('content') : 'authenticity_token';
};

/**
 * Get headers object with CSRF token
 * @param {Object} additionalHeaders - Additional headers to include
 * @returns {Object} Headers object with CSRF token
 */
export const getCsrfHeaders = (additionalHeaders = {}) => {
  const token = getCsrfToken();
  
  return {
    'X-CSRF-Token': token,
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };
};

/**
 * Enhanced fetch with automatic CSRF token inclusion
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export const csrfFetch = (url, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  
  // Only add CSRF token for non-GET requests
  if (method !== 'GET' && method !== 'HEAD') {
    const token = getCsrfToken();
    
    if (!token) {
      console.warn('CSRF token not found. Request may fail.');
    }
    
    options.headers = {
      ...options.headers,
      'X-CSRF-Token': token,
    };
  }
  
  return fetch(url, options);
};

export default {
  getCsrfToken,
  getCsrfParam,
  getCsrfHeaders,
  csrfFetch,
};


