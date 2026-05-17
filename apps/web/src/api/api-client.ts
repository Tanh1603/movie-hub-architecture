import axios, { AxiosError, AxiosRequestConfig } from 'axios';

// API Response wrapper type based on backend format
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

// Error response type
export interface ApiError {
  success: false;
  message: string;
  error?: string;
  statusCode?: number;
}

// Normalize backend base URL so services can consistently use `/api/v1/...` paths
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:4000/api/v1';

const isDev = process.env.NODE_ENV !== 'production';

// Base API client
const apiClient = axios.create({
  baseURL: backendUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

// Store the token getter function
let tokenGetter: (() => Promise<string | null>) | null = null;

// Function to set the token getter (call this from PageWrapper component)
export const setAuthTokenGetter = (getter: () => Promise<string | null>) => {
  tokenGetter = getter;
};

apiClient.interceptors.request.use(
  async (config) => {
    if (tokenGetter) {
      try {
        const token = await tokenGetter();
        if (token) {
          config.headers = config.headers || {};
          (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        if (isDev) {
          console.warn('[API] Failed to get auth token:', err instanceof Error ? err.message : String(err));
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status;
    const responseData = error.response?.data;
    const message = responseData?.message || error.message || 'An error occurred';

    if (isDev) {
      try {
        let safeResponseData: unknown = undefined;
        try {
          safeResponseData = JSON.parse(JSON.stringify(error.response?.data));
        } catch {
          safeResponseData = '<unserializable response data>';
        }

        console.error('[API] Response error:', {
          status,
          url: error.config?.url,
          message,
          responseData: safeResponseData,
        });
      } catch {
        console.error('[API] Response error:', message);
      }
    }

    const wrappedError = new Error(message) as Error & {
      status?: number;
      responseData?: unknown;
      raw?: unknown;
    };
    wrappedError.status = status;
    wrappedError.responseData = responseData;
    wrappedError.raw = error;

    return Promise.reject(wrappedError);
  }
);

// Generic API methods
export const api = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return response.data.data;
  },

  post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data.data;
  },

  put: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response.data.data;
  },

  patch: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
    return response.data.data;
  },

  delete: async <T = void>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response.data.data;
  },
};

export default apiClient;
