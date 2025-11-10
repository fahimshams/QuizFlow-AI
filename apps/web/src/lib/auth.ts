/**
 * Auth Utilities
 *
 * Client-side auth management:
 * - Token storage
 * - User state
 * - Login/logout helpers
 */

import api from './axios';
import { User, AuthTokens } from '@quizflow/types';

interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    tokens: AuthTokens;
  };
}

/**
 * Login user
 */
export const login = async (
  email: string,
  password: string
): Promise<User> => {
  const response = (await api.post('/auth/login', {
    email,
    password,
  })) as LoginResponse;

  // Store tokens
  localStorage.setItem('accessToken', response.data.tokens.accessToken);
  localStorage.setItem('refreshToken', response.data.tokens.refreshToken);

  return response.data.user;
};

/**
 * Register user
 */
export const register = async (
  email: string,
  password: string,
  name: string
): Promise<User> => {
  const response = (await api.post('/auth/register', {
    email,
    password,
    name,
  })) as LoginResponse;

  // Store tokens
  localStorage.setItem('accessToken', response.data.tokens.accessToken);
  localStorage.setItem('refreshToken', response.data.tokens.refreshToken);

  return response.data.user;
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  const refreshToken = localStorage.getItem('refreshToken');

  try {
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken });
    }
  } finally {
    // Clear tokens even if API call fails
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;

  try {
    // Decode JWT to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const isExpired = Date.now() >= expirationTime;

    if (isExpired) {
      // Token is expired, clear it and trigger logout
      logoutImmediately();
      return false;
    }

    return true;
  } catch (error) {
    // Invalid token format, clear it and trigger logout
    logoutImmediately();
    return false;
  }
};

/**
 * Immediately logout user without API call
 * Used for token expiration and invalid tokens
 */
export const logoutImmediately = (): void => {
  // Clear tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');

  // Dispatch custom event to notify components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-logout'));

    // Redirect to login if not already there
    if (!window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register') &&
        window.location.pathname !== '/') {
      window.location.href = '/login';
    }
  }
};

