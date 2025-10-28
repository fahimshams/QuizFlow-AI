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

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/**
 * Request Interceptor
 * Attach auth token to every request
 */
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
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

