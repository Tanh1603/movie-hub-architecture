import axios from 'axios';

const rawBaseTop = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';
const normalizedTop = rawBaseTop.replace(/\/+$/g, '').trim() || undefined;

const api = axios.create({
  baseURL: normalizedTop,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let tokenGetter: (() => Promise<string | null>) | null = null;

export const setAuthTokenGetter = (getter: () => Promise<string | null>) => {
  tokenGetter = getter;
};

api.interceptors.request.use(
  async (config) => {
    if (tokenGetter) {
      try {
        const token = await tokenGetter();
        if (token) {
          config.headers = config.headers || {};
          (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
        }
      } catch {
        // ignore token attachment errors for this legacy client
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
