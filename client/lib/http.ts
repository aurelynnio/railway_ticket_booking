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
      .catch((err) => {
        // refresh failed — clear promise so next request can try again
        refreshPromise = null;
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;
    const requestUrl = String(originalRequest?.url ?? "");
    const canAttemptRefresh =
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !requestUrl.includes("/auth/login") &&
      !requestUrl.includes("/auth/refresh-token");

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

    const isAuthRoute =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/refresh-token");

    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/login" &&
      !isAuthRoute
    ) {
      window.location.href = loginRedirectUrl();
    }

    return Promise.reject(error);
  },
);

export default http;
