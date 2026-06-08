import axios from "axios";

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

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
      !requestUrl.includes("/auth/refreshToken");

    if (canAttemptRefresh && originalRequest) {
      originalRequest._retry = true;

      try {
        await http.post("/auth/refreshToken");
        return http(originalRequest);
      } catch (refreshError) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default http;
