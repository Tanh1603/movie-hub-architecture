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
const rawBase = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:4000';
// Remove trailing slashes and whitespace
let normalizedBase = rawBase.replace(/\/+$|\s+$/g, '');
// If environment accidentally includes the `/api/v1` prefix, strip it so
// service paths (which already include `/api/v1`) won't be duplicated.
normalizedBase = normalizedBase.replace(/\/api\/v1$/i, '');

console.log('[API] Initialized with base URL:', normalizedBase);

// Base API client
const apiClient = axios.create({
  baseURL: normalizedBase,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  // Enable sending credentials (cookies) with cross-origin requests
  // This is critical for ClerkAuthGuard to receive __session cookie
  withCredentials: true,
});

// Store the token getter function
let tokenGetter: (() => Promise<string | null>) | null = null;

// Function to set the token getter (call this from PageWrapper component)
export const setAuthTokenGetter = (getter: () => Promise<string | null>) => {
  tokenGetter = getter;
  console.log('[API] Token getter configured');
};

// Request interceptor for auth (both Bearer token and cookies)
// For ClerkAuthGuard: Backend reads cookie `__session` from request.cookies
// Token via header is optional; guard primarily validates via cookie.
apiClient.interceptors.request.use(
  async (config) => {
    // Try to get token from the configured getter
    if (tokenGetter) {
      try {
        const token = await tokenGetter();
        if (token) {
          config.headers = config.headers || {};
          (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
          console.log('[API] Attached Bearer token to request:', config.url);
        }
      } catch (err) {
        console.warn('[API] Failed to get auth token:', err instanceof Error ? err.message : String(err));
      }
    }
    
    // Log request details for debugging
    console.log('[API] Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      withCredentials: config.withCredentials,
      hasAuthHeader: !!config.headers?.['Authorization'],
    });
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('[API] Response success:', {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status;
    const responseData = error.response?.data;
    const message = responseData?.message || error.message || 'An error occurred';
    
    // Protect logging from throwing when `error` contains circular or
    // non-serializable structures. Try to produce a safe, plain object
    // for console output; fall back to minimal text if that fails.
    try {
      let safeResponseData: unknown = undefined;
      try {
        safeResponseData = JSON.parse(JSON.stringify(error.response?.data));
      } catch {
        // If JSON stringify fails (circular structures), coerce to string
        try {
          safeResponseData = String(error.response?.data);
        } catch {
          safeResponseData = '<unserializable response data>';
        }
      }

      console.error('[API] Response error:', {
        status,
        url: error.config?.url,
        message,
        withCredentials: error.config?.withCredentials,
        responseData: safeResponseData,
      });
    } catch (logErr) {
      // Last-resort: logging failed (rare). Emit simple messages so dev can see something.
      console.error('[API] Response error (logging failed):', message);
      console.error('[API] Original error object:', error);
      console.error('[API] Logging failure reason:', logErr);
    }
    
    // Special handling for 401 (auth errors)
    if (status === 401) {
      console.error('[API] ❌ 401 Unauthorized - Check if __session cookie is present and valid');
      if (typeof window !== 'undefined') {
        // Log cookies for debugging (will show only domain-accessible cookies)
        console.log('[API] Document cookies:', document.cookie);
      }
    }
    
    // Create a richer error object so callers (hooks) can inspect status and response data.
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
