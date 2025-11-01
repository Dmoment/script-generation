import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CurrentService } from '../types/generated/services.gen';
import { csrfFetch } from '../utils/csrf';
import type { User } from '../types/api';
import '../lib/openapi-config'; // Configure OpenAPI client

/**
 * Authentication Context Type
 * Defines the shape of the auth context value
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

/**
 * Create the Auth Context
 * undefined means the context hasn't been provided yet
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 * Wraps the app and provides authentication state
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCurrentUser = async (): Promise<void> => {
      try {
        // ✅ Using auto-generated API service
        const userData = await CurrentService.getCurrent();
        setUser(userData);
      } catch (error) {
        // If error (404, 401, etc.), user is not logged in
        console.error('Failed to fetch current user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const logout = async (): Promise<void> => {
    try {
      // DELETE request - CSRF token automatically included
      await csrfFetch('/logout', { method: 'DELETE' });
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use the Auth Context
 * Throws an error if used outside of AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

