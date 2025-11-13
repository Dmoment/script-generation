/**
 * useAuthenticatedApi Hook
 * 
 * Provides API methods that automatically include Auth0 access token
 * in the Authorization header.
 * 
 * Usage:
 * ```tsx
 * const { callApi } = useAuthenticatedApi();
 * const projects = await callApi(() => ApiService.getProjects());
 * ```
 */

import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { setAuthTokenProvider } from '../lib/authTokenProvider';

const AUTH0_SCOPE = 'openid profile email';

export const useAuthenticatedApi = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const providerRef = React.useRef<(() => Promise<string | null | undefined>) | null>(null);

  React.useEffect(() => {
    if (!isAuthenticated) {
      providerRef.current = null;
      setAuthTokenProvider(null);
      return;
    }

    const provider = async () => {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          scope: AUTH0_SCOPE,
        },
      });
      return token ?? null;
    };

    providerRef.current = provider;
    setAuthTokenProvider(provider);

    return () => {
      if (providerRef.current === provider) {
        providerRef.current = null;
        setAuthTokenProvider(null);
      }
    };
  }, [getAccessTokenSilently, isAuthenticated]);

  /**
   * Wraps an API call with automatic token injection
   */
  const callApi = React.useCallback(async <T,>(apiCall: () => Promise<T>): Promise<T> => {
    if (!isAuthenticated) {
      throw new Error('User is not authenticated');
    }

    return apiCall();
  }, [getAccessTokenSilently, isAuthenticated]);

  return { callApi, isAuthenticated };
};

