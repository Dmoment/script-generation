import React from 'react';
import { useAuthenticatedApi } from '../hooks/useAuthenticatedApi';

/**
 * AuthTokenBridge
 *
 * Headless component that mounts the Auth0 ➜ OpenAPI token bridge.
 * Simply render this once near the root of the React tree (inside
 * Auth0Provider). It registers a global token provider that the
 * OpenAPI request interceptor can call before every request.
 */
const AuthTokenBridge: React.FC = () => {
  useAuthenticatedApi();
  return null;
};

export default AuthTokenBridge;






