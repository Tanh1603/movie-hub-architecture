import axios from 'axios';

const rawBaseTop = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';
const normalizedTop = rawBaseTop.replace(/\/+$|\s+$/g, '') || undefined;

// Debug: Log actual base URL being used
console.log(`[API] Initialized with base URL: ${normalizedTop}`);

const api = axios.create({
  baseURL: normalizedTop,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Store the token getter function
let tokenGetter: (() => Promise<string | null>) | null = null;

// Function to set the token getter (call this from your root component)
export const setAuthTokenGetter = (getter: () => Promise<string | null>) => {
  tokenGetter = getter;
};

// Add Clerk token to every request
api.interceptors.request.use(
  async (config) => {
    if (tokenGetter) {
      try {
        const token = await tokenGetter();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Failed to get auth token:', error);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

// Attach Clerk token to top-level api client as well (client-side only)
api.interceptors.request.use(
  async (config) => {
    try {
      if (typeof window === 'undefined') return config;
      const clerkModule = await import('@clerk/nextjs');
      const clerkTyped = clerkModule as unknown as {
        getToken?: () => Promise<string | undefined>;
        default?: { getToken?: () => Promise<string | undefined> };
      };
      const getTokenFn = clerkTyped.getToken ?? clerkTyped.default?.getToken;
      if (typeof getTokenFn === 'function') {
        const token = await getTokenFn();
        if (token) {
          config.headers = config.headers || {};
          (config.headers as Record<string, string>)[
            'Authorization'
          ] = `Bearer ${token}`;
        }
      }
    } catch {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);
