/**
 * Single auth seam for the app.
 *
 * Normally this is Auth0's hook. When the Rails layout flags development
 * bypass mode (<meta name="dev-auth-bypass" content="1">, only emitted in
 * development/test with DEV_AUTH_BYPASS=1), a stub session is returned so the
 * app can be exercised end to end without an Auth0 login. The flag is fixed
 * for the lifetime of a page, so the hook order below is stable.
 */
import { useAuth0 } from "@auth0/auth0-react";

export const DEV_BYPASS_TOKEN = "dev-bypass-token";

export function isDevAuthBypass(): boolean {
  if (typeof document === "undefined") return false;
  return document.querySelector('meta[name="dev-auth-bypass"]')?.getAttribute("content") === "1";
}

const devSession = {
  isAuthenticated: true,
  isLoading: false,
  user: { name: "Dev Tester", email: "dev.tester@localhost", sub: "dev|bypass" },
  error: undefined,
  loginWithRedirect: async () => {},
  loginWithPopup: async () => {},
  logout: async () => {},
  getAccessTokenSilently: (async () => DEV_BYPASS_TOKEN) as unknown as ReturnType<typeof useAuth0>["getAccessTokenSilently"],
  getAccessTokenWithPopup: async () => DEV_BYPASS_TOKEN,
  getIdTokenClaims: async () => undefined,
  handleRedirectCallback: async () => ({ appState: undefined }),
} as unknown as ReturnType<typeof useAuth0>;

export function useAuth(): ReturnType<typeof useAuth0> {
  if (isDevAuthBypass()) return devSession;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useAuth0();
}

// Same name as the vendor hook so call sites stay unchanged.
export { useAuth as useAuth0 };
