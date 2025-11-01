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
 * @returns CSRF token or null if not found
 */
export const getCsrfToken = (): string | null => {
  const metaTag = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
  return metaTag ? metaTag.getAttribute('content') : null;
};

/**
 * Get CSRF param name from meta tag
 * @returns CSRF param name (default: 'authenticity_token')
 */
export const getCsrfParam = (): string => {
  const metaTag = document.querySelector<HTMLMetaElement>('meta[name="csrf-param"]');
  return metaTag ? metaTag.getAttribute('content') || 'authenticity_token' : 'authenticity_token';
};

/**
 * Get headers object with CSRF token
 * @param additionalHeaders - Additional headers to include
 * @returns Headers object with CSRF token
 */
export const getCsrfHeaders = (additionalHeaders: Record<string, string> = {}): Record<string, string> => {
  const token = getCsrfToken();
  
  return {
    'X-CSRF-Token': token || '',
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };
};

/**
 * Enhanced fetch with automatic CSRF token inclusion
 * @param url - URL to fetch
 * @param options - Fetch options
 * @returns Fetch response
 */
export const csrfFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const method = (options.method || 'GET').toUpperCase();
  
  // Only add CSRF token for non-GET requests
  if (method !== 'GET' && method !== 'HEAD') {
    const token = getCsrfToken();
    
    if (!token) {
      console.warn('CSRF token not found. Request may fail.');
    }
    
    options.headers = {
      ...options.headers,
      'X-CSRF-Token': token || '',
    } as HeadersInit;
  }
  
  return fetch(url, options);
};

export default {
  getCsrfToken,
  getCsrfParam,
  getCsrfHeaders,
  csrfFetch,
};

