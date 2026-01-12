import axios from 'axios';
import { API_URL } from '@/constants';
import { useAuthStore } from '@/features/auth/stores/auth.store';

// Store Clerk's getToken function globally
let clerkGetToken: (() => Promise<string | null>) | null = null;

export const setClerkTokenGetter = (getter: () => Promise<string | null>) => {
  clerkGetToken = getter;
};

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - automatically add Clerk token if available
api.interceptors.request.use(
  async (config) => {
    if (__DEV__) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }

    // Try to get Clerk token and add to headers
    if (clerkGetToken) {
      try {
        const token = await clerkGetToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          if (__DEV__) {
            console.log('[API Request] Added Clerk token to request');
          }
        }
      } catch (error) {
        console.error('[API Request] Failed to get Clerk token:', error);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    if (__DEV__) {
      console.log(
        `[API Error] ${error.response?.status} ${error.config?.url}: ${error.response?.data?.message || error.message}`
      );
    }

    // Handle 401 - clear store and trigger logout
    if (error.response?.status === 401) {
      const { logout } = useAuthStore.getState();
      logout();
    }

    return Promise.reject(error);
  }
);

// Helper function to make authenticated API calls
// Use this for calls that need Clerk token
export async function authenticatedApiCall<T>(
  method: 'get' | 'post' | 'patch' | 'delete',
  url: string,
  getToken: () => Promise<string | null>,
  data?: object
): Promise<T> {
  const token = await getToken();

  if (!token) {
    console.log('[authenticatedApiCall] No Clerk token available');
    throw new Error('No Clerk token available');
  }

  if (__DEV__) {
    console.log('[authenticatedApiCall] Token preview:', token.substring(0, 20) + '...');
  }

  const config = {
    method,
    url,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(data && { data }),
  };

  const response = await api(config);

  // Backend wraps responses in { success, data, timestamp }
  // Extract the actual data from the wrapper
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data as T;
  }

  return response.data;
}
