/**
 * Token Expiration Hook
 *
 * Proactively monitors token expiration and triggers logout
 * when the token expires, even without API calls.
 */

import { useEffect } from 'react';
import { logoutImmediately } from '@/lib/auth';

export function useTokenExpiration() {
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('accessToken');

      if (!token) return;

      try {
        // Decode JWT to check expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        const isExpired = Date.now() >= expirationTime;

        if (isExpired) {
          console.log('Token expired, logging out...');
          logoutImmediately();
        }
      } catch (error) {
        // Invalid token format
        console.error('Invalid token format, logging out...');
        logoutImmediately();
      }
    };

    // Check immediately on mount
    checkTokenExpiration();

    // Check every 30 seconds
    const interval = setInterval(checkTokenExpiration, 30000);

    return () => clearInterval(interval);
  }, []);
}

