import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { ApiResponse, ServiceResult, ApiSuccessResponse } from '@movie-hub/shared-types';

// Normalize backend base URL so services can consistently use `/api/v1/...` paths
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3000/api/v1';

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
  (error: AxiosError<any>) => {
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

/**
 * Transforms the flat ApiResponse from the backend into a standardized ServiceResult.
 * BE Structure: { success: boolean, data: T, meta?: Meta, message?: string, ... }
 * FE Structure: T & { data: T, meta?: Meta, message?: string }
 */
const transformToServiceResult = <T>(resData: ApiResponse<T>): T & ServiceResult<T> => {
  // If it's a success response, extract the data and metadata
  if (resData.success) {
    const successRes = resData as ApiSuccessResponse<T>;
    
    // We want the primary result to be the data itself
    const data = successRes.data;
    
    // If data is null or undefined, we can't attach properties
    if (data === null || data === undefined) {
      return data as any;
    }

    // Attach ServiceResult properties to the data object
    // This allows both 'result.someProp' and 'result.data' to work
    const result = data as any;
    
    // Use defineProperty to avoid cluttering the object and potential collisions if T has these props
    // but also ensure they are available for the ServiceResult interface
    if (!('data' in result)) {
      Object.defineProperty(result, 'data', {
        get() { return data; },
        enumerable: false,
        configurable: true
      });
    }
    
    if (successRes.meta !== undefined) {
      Object.defineProperty(result, 'meta', {
        value: successRes.meta,
        enumerable: false,
        writable: true,
        configurable: true
      });
    }
    
    if (successRes.message !== undefined) {
      Object.defineProperty(result, 'message', {
        value: successRes.message,
        enumerable: false,
        writable: true,
        configurable: true
      });
    }
    
    return result;
  }
  
  throw new Error(resData.message || 'API Request failed');
};

/**
 * Helper to wrap data into a ServiceResult that also acts as the data itself.
 */
export const wrapServiceResult = <T>(data: T, meta?: any, message?: string): T & ServiceResult<T> => {
  if (data === null || data === undefined) {
    return data as any;
  }

  const result = data as any;
  
  if (!('data' in result)) {
    Object.defineProperty(result, 'data', {
      get() { return data; },
      enumerable: false,
      configurable: true
    });
  }
  
  if (meta !== undefined) {
    Object.defineProperty(result, 'meta', {
      value: meta,
      enumerable: false,
      writable: true,
      configurable: true
    });
  }
  
  if (message !== undefined) {
    Object.defineProperty(result, 'message', {
      value: message,
      enumerable: false,
      writable: true,
      configurable: true
    });
  }
  
  return result;
};

// Generic API methods
export const api = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T & ServiceResult<T>> => {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return transformToServiceResult(response.data);
  },

  post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T & ServiceResult<T>> => {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return transformToServiceResult(response.data);
  },

  put: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T & ServiceResult<T>> => {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return transformToServiceResult(response.data);
  },

  patch: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T & ServiceResult<T>> => {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
    return transformToServiceResult(response.data);
  },

  delete: async <T = void>(url: string, config?: AxiosRequestConfig): Promise<T & ServiceResult<T>> => {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return transformToServiceResult(response.data);
  },
};



export default apiClient;
