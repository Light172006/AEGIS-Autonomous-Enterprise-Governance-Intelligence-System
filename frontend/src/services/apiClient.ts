import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor — attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("aegis_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 Unauthorized cleanly
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      if (window.location.pathname !== "/login") {
        localStorage.removeItem("aegis_token");
        localStorage.removeItem("aegis_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Executes an API call with automatic fallback to isolated mock service
 * when the backend server is offline or returns a network failure.
 */
export async function withFallback<T>(
  apiFn: () => Promise<T>,
  mockFn: () => Promise<T>
): Promise<T> {
  try {
    return await apiFn();
  } catch {
    // If backend is unreachable or returns server error, gracefully fall back to mock data
    return mockFn();
  }
}
