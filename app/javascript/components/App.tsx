import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { useAuth0 } from '@auth0/auth0-react';
import Header from './Header';
import Footer from './Footer';
import LandingPage from '../pages/LandingPage';
import DashboardPage from '../pages/DashboardPage';
import ScriptDatabasePage from '../pages/ScriptDatabasePage';
import ScriptEditorPage from '../pages/ScriptEditorPage';
import AuthTokenBridge from './AuthTokenBridge';
import LoadingScreen from './LoadingScreen';
import { queryClient } from '../lib/queryClient';

/**
 * Feature interface for marketing features
 */
interface Feature {
  id?: string;
  title: string;
  description: string;
  icon?: string;
}

/**
 * App component props
 */
interface AppProps {
  features?: Feature[];
  appName?: string;
}

/**
 * Route handler that checks for Auth0 callback
 */
const RootRouteHandler: React.FC<{ features: Feature[]; appName: string }> = ({ features, appName }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth0();
  const [isAuthCallback, setIsAuthCallback] = useState(false);

  useEffect(() => {
    // Check if this is an Auth0 callback
    const urlParams = new URLSearchParams(location.search);
    const hasAuthParams = urlParams.has('code') && urlParams.has('state');
    
    if (hasAuthParams) {
      setIsAuthCallback(true);
    }
  }, [location]);

  useEffect(() => {
    // Redirect authenticated users away from root
    if (isAuthenticated && location.pathname === '/') {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated, location.pathname]);

  // Show loading during Auth0 callback or while Auth0 is loading
  if (isAuthCallback || (isLoading && location.pathname === '/')) {
    return <LoadingScreen />;
  }

  // Don't render landing page if authenticated (redirect will happen)
  if (isAuthenticated) {
    return <LoadingScreen />;
  }

  // Render landing page for unauthenticated users
  return (
    <>
      <div className="mx-auto max-w-6xl px-4">
        <Header features={features} appName={appName} />
      </div>
      <LandingPage features={features} appName={appName} />
      <div className="mx-auto max-w-6xl px-4">
        <Footer appName={appName} />
      </div>
    </>
  );
};

/**
 * Main App Component
 * Handles routing and provides authentication context
 */
const App: React.FC<AppProps> = ({ features = [], appName = 'Script Generation' }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthTokenBridge />
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Routes>
            {/* Landing page route - with Auth0 callback handling */}
            <Route 
              path="/"
              element={<RootRouteHandler features={features} appName={appName} />}
            />
            
            {/* Dashboard route - no header/footer */}
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Script Database route */}
            <Route path="/scripts" element={<ScriptDatabasePage />} />
            
            {/* Script Editor route */}
            <Route path="/scripts/:scriptId/versions/:versionId" element={<ScriptEditorPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;

