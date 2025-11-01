import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import Header from './Header';
import Footer from './Footer';
import LandingPage from '../pages/LandingPage';
import DashboardPage from '../pages/DashboardPage';

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
 * Main App Component
 * Handles routing and provides authentication context
 */
const App: React.FC<AppProps> = ({ features = [], appName = 'Script Generation' }) => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Routes>
            {/* Landing page route */}
            <Route 
              path="/" 
              element={
                <>
                  <div className="mx-auto max-w-6xl px-4">
                    <Header features={features} appName={appName} />
                  </div>
                  <LandingPage features={features} appName={appName} />
                  <div className="mx-auto max-w-6xl px-4">
                    <Footer appName={appName} />
                  </div>
                </>
              } 
            />
            
            {/* Dashboard route - no header/footer */}
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

