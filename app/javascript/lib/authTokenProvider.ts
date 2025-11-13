/**
 * Global Auth Token Provider
 *
 * Provides a pluggable way for React components to supply an async function
 * that returns an access token. OpenAPI interceptors can call this provider
 * for every request to inject the latest JWT automatically.
 */

export type AuthTokenProvider = () => Promise<string | null | undefined>;

let tokenProvider: AuthTokenProvider | null = null;

/**
 * Register (or clear) the global token provider.
 */
export const setAuthTokenProvider = (provider: AuthTokenProvider | null) => {
  tokenProvider = provider;
};

/**
 * Retrieve the current token from the registered provider.
 */
export const getAuthToken = async (): Promise<string | null> => {
  if (!tokenProvider) {
    return null;
  }

  try {
    const token = await tokenProvider();
    return token ?? null;
  } catch (error) {
    console.error('Failed to resolve auth token', error);
    return null;
  }
};


