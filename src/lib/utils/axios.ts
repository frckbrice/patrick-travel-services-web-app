// Axios configuration with interceptors for Patrick Travel Services (Firebase Auth)
// SECURITY: Tokens are retrieved on-demand from Firebase - never from localStorage

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../constants';
import { logger } from './logger';
import { getFreshToken } from '../auth/token-manager';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - automatically attach Firebase ID token
// SECURITY: Token retrieved on-demand from Firebase, never from localStorage
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get current Firebase user and token
    if (typeof window !== 'undefined') {
      try {
        // SECURITY: Get fresh token on-demand (not from localStorage)
        const token = await getFreshToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        logger.warn('Failed to get Firebase token', error);
      }
    }

    logger.debug('API Request', {
      method: config.method,
      url: config.url,
    });

    return config;
  },
  (error: AxiosError) => {
    logger.error('Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    logger.debug('API Response', {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized - token might need refresh
    // SECURITY: Force token refresh from Firebase (not localStorage)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== 'undefined'
    ) {
      originalRequest._retry = true;

      try {
        // SECURITY: Force refresh from Firebase Auth
        const token = await getFreshToken(true); // Force refresh

        if (token) {
          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }

          return apiClient(originalRequest);
        } else {
          // No user logged in, redirect to login
          logger.info('No authenticated user - redirecting to login');
          window.location.href = '/login';
        }
      } catch (refreshError) {
        logger.error('Token refresh failed', refreshError);

        // Redirect to login
        window.location.href = '/login';

        return Promise.reject(refreshError);
      }
    }

    // Log error
    logger.error('API Error', error, {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
    });

    return Promise.reject(error);
  }
);
