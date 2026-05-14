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
    const body = (await api.get('/auth/me')) as {
      success?: boolean;
      data?: User;
    };
    return body.data ?? null;
  } catch {
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('accessToken');
};

/**
 * PATCH /auth/profile — update name and/or email
 */
export const updateProfileApi = async (payload: {
  name?: string;
  email?: string;
}): Promise<User> => {
  const res = (await api.patch('/auth/profile', payload)) as {
    success: boolean;
    data: User;
  };
  return res.data;
};

/**
 * POST /auth/password — clears local tokens (refresh revoked server-side)
 */
export const changePasswordApi = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  await api.post('/auth/password', { currentPassword, newPassword });
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

