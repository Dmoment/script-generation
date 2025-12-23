import { OpenAPI } from "../types/generated/core/OpenAPI";
import { getAuthToken } from "./authTokenProvider";

OpenAPI.BASE = "/api";
OpenAPI.WITH_CREDENTIALS = false;
OpenAPI.CREDENTIALS = "same-origin";

OpenAPI.interceptors.request.use(async (request) => {
  const token = await getAuthToken();
  const headers = new Headers(request.headers ?? {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (request.body instanceof FormData) {
    headers.delete("Content-Type");
  }

  return {
    ...request,
    headers,
  };
});

let isRedirecting = false;
let redirectTimeout: ReturnType<typeof setTimeout> | null = null;
const recent401s: Array<{ time: number; url: string }> = [];
const TIME_WINDOW_MS = 10000;

const cleanupOld401s = (now: number) => {
  while (recent401s.length > 0 && now - recent401s[0].time > TIME_WINDOW_MS) {
    recent401s.shift();
  }
};

OpenAPI.interceptors.response.use(async (response: Response) => {
  if (response.status === 401) {
    const currentPath = window.location.pathname;
    const isOnLandingPage = currentPath === "/" || currentPath === "/index";
    const now = Date.now();

    if (isOnLandingPage || isRedirecting) {
      return response;
    }

    const requestUrl = response.url || "";
    cleanupOld401s(now);
    recent401s.push({ time: now, url: requestUrl });

    if (redirectTimeout) {
      clearTimeout(redirectTimeout);
    }

    redirectTimeout = setTimeout(async () => {
      const stillOnProtectedPage =
        window.location.pathname !== "/" &&
        window.location.pathname !== "/index" &&
        !window.location.pathname.startsWith("/auth");

      if (!stillOnProtectedPage || isRedirecting) {
        return;
      }

      cleanupOld401s(Date.now());
      const currentUniqueCount = new Set(recent401s.map((r) => r.url)).size;
      const currentTotalCount = recent401s.length;

      try {
        const responseData = await response
          .clone()
          .json()
          .catch(() => ({}));
        const errorMessage = (responseData.error || "").toLowerCase();

        const isTokenError =
          errorMessage.includes("expired") ||
          errorMessage.includes("invalid") ||
          errorMessage.includes("token") ||
          errorMessage.includes("unauthorized");

        if (isTokenError) {
          if (
            currentUniqueCount >= 3 ||
            (currentTotalCount >= 5 && currentUniqueCount >= 2)
          ) {
            isRedirecting = true;
            console.warn(
              `Multiple 401 errors detected (${currentTotalCount} total, ${currentUniqueCount} unique) - redirecting to login`
            );
            window.location.href = "/";
          }
        }
      } catch (e) {
        if (
          currentUniqueCount >= 4 ||
          (currentTotalCount >= 7 && currentUniqueCount >= 3)
        ) {
          isRedirecting = true;
          console.warn(
            `Multiple 401 errors without response body (${currentTotalCount} total, ${currentUniqueCount} unique) - redirecting to login`
          );
          window.location.href = "/";
        }
      }
    }, 3000);
  } else if (response.status >= 200 && response.status < 300) {
    if (recent401s.length > 0) {
      const now = Date.now();
      cleanupOld401s(now);
    }
  }

  return response;
});

export default OpenAPI;
