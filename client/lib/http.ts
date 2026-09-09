import axios from "axios";

function loginRedirectUrl() {
  if (typeof window === "undefined") {
    return "/login";
  }

  const currentPath = `${window.location.pathname}${window.location.search}`;
  const next =
    currentPath && currentPath !== "/login"
      ? `?next=${encodeURIComponent(currentPath)}`
      : "";

  return `/login${next}`;
}

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Singleton refresh promise — ensures only one refresh request fires
// even when multiple concurrent requests get 401 at the same time.
let refreshPromise: Promise<void> | null = null;

function refreshTokens(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = http
      .post("/auth/refresh-token")
      .then(() => {
        // refresh succeeded
      })
      .finally(() => {
        // Reset in all cases (success or failure) so the next 401 can retry.
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/** Known auth endpoints must never trigger the refresh/retry cycle. */
function isAuthPath(requestUrl: string): boolean {
  if (!requestUrl) return false;
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const pathname = new URL(requestUrl, origin).pathname;
    return pathname.startsWith("/auth/");
  } catch {
    return requestUrl.includes("/auth/");
  }
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;
    const requestUrl = String(originalRequest?.url ?? "");
    const isAuthOrPublicRoute = isAuthPath(requestUrl);

    const canAttemptRefresh =
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthOrPublicRoute;

    if (canAttemptRefresh && originalRequest) {
      originalRequest._retry = true;

      try {
        // Dedupe: all concurrent 401 requests share the same refresh promise
        await refreshTokens();
        return http(originalRequest);
      } catch (refreshError) {
        if (typeof window !== "undefined") {
          window.location.href = loginRedirectUrl();
        }

        return Promise.reject(refreshError);
      }
    }

    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/login" &&
      !isAuthOrPublicRoute
    ) {
      window.location.href = loginRedirectUrl();
    }

    return Promise.reject(error);
  },
);

export default http;
