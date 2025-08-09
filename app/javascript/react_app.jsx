import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import { mountHeaderPropsFromDom } from './components/Header';

// Initialize React when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('react-root');
  if (rootElement) {
    const props = mountHeaderPropsFromDom(rootElement);
    const root = createRoot(rootElement);
    root.render(<App {...props} />);
  }
});