/**
 * Axios Configuration
 *
 * BEST PRACTICES:
 * - Centralized API client
 * - Auto-attach auth tokens
 * - Handle errors globally
 * - Request/response interceptors
 */

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Helper function to immediately logout and redirect
 */
const handleImmediateLogout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');

  // Dispatch custom event to notify components about logout
  window.dispatchEvent(new Event('auth-logout'));

  // Only redirect if not already on login/register page
  if (!window.location.pathname.includes('/login') &&
      !window.location.pathname.includes('/register')) {
    window.location.href = '/login';
  }
};

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/**
 * Request Interceptor
 * Attach auth token to every request and check expiration
 */
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');

    if (token) {
      try {
        // Proactively check if token is expired before making request
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        const isExpired = Date.now() >= expirationTime;

        if (isExpired) {
          // Token is expired, logout immediately
          handleImmediateLogout();
          return Promise.reject(new Error('Token expired'));
        }

        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        // Invalid token format, logout immediately
        handleImmediateLogout();
        return Promise.reject(new Error('Invalid token'));
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handle errors globally
 */
api.interceptors.response.use(
  (response) => {
    // Return just the data for successful responses
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');

      // Only try to refresh if we have a refresh token
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout immediately
          console.error('Token refresh failed:', refreshError);
          handleImmediateLogout();
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, logout immediately
        handleImmediateLogout();
        return Promise.reject(error);
      }
    }

    // Return standardized error
    return Promise.reject({
      message:
        error.response?.data?.message ||
        error.message ||
        'An error occurred',
      statusCode: error.response?.status || 500,
      data: error.response?.data,
    });
  }
);

export default api;

