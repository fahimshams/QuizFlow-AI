'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';

/**
 * Renders children only when a user is signed in; otherwise redirects to /login.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-600">
        {loading ? 'Loading…' : 'Redirecting to sign in…'}
      </div>
    );
  }

  return <>{children}</>;
}
