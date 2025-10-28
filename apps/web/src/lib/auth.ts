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
  return !!localStorage.getItem('accessToken');
};

