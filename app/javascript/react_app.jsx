import React from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./components/App";
import { mountHeaderPropsFromDom } from "./components/Header";
import "./lib/openapi-config";

// Initialize React when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    const props = mountHeaderPropsFromDom(rootElement);

    const auth0Domain = process.env.AUTH0_DOMAIN;
    const auth0ClientId = process.env.AUTH0_CLIENT_ID;
    const auth0Audience = process.env.AUTH0_AUDIENCE;

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
      >
        <App {...props} />
      </Auth0Provider>
    );
  }
});
