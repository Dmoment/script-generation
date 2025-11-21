import React from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./components/App";
import { mountHeaderPropsFromDom } from "./components/Header";
import "./lib/openapi-config";

// Initialize React when DOM is loaded
// Only mount React for interactive routes (dashboard, etc.), not for root marketing page
function mountReact() {
  const pathname = window.location.pathname;

  // Check if this is an Auth0 callback (has code and state params)
  const urlParams = new URLSearchParams(window.location.search);
  const isAuth0Callback = urlParams.has('code') && urlParams.has('state');
  
  // Skip React mounting on root path UNLESS it's an Auth0 callback
  // Also skip if landing-page element exists and it's not an Auth0 callback
  if ((pathname === '/' || pathname === '/index') && !isAuth0Callback) {
    if (document.getElementById("landing-page")) {
      return;
    }
  }

  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error('Root element not found for path:', pathname);
    return;
  }

  const props = mountHeaderPropsFromDom(rootElement);

  const auth0Domain = process.env.AUTH0_DOMAIN;
  const auth0ClientId = process.env.AUTH0_CLIENT_ID;
  const auth0Audience = process.env.AUTH0_AUDIENCE;

  if (!auth0Domain || !auth0ClientId) {
    console.error('Auth0 configuration missing');
    return;
  }

  const root = createRoot(rootElement);

  root.render(
    <Auth0Provider
      domain={auth0Domain}
      clientId={auth0ClientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        scope: "openid profile email",
        ...(auth0Audience && { audience: auth0Audience }),
      }}
      onRedirectCallback={(appState) => {
        // Navigate to the returnTo URL or dashboard after login
        const returnTo = appState?.returnTo || '/dashboard';
        window.location.href = returnTo;
      }}
    >
      <App {...props} />
    </Auth0Provider>
  );
}

// Try mounting immediately if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", mountReact);
} else {
  // DOM already loaded, mount immediately
  mountReact();
}
