/**
 * Navigation Bar Component
 */

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from './ui/Button';
import { useAuth } from '@/components/auth-context';
import { getEffectivePlan, planDisplayName } from '@/lib/subscription';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
    router.refresh();
  };

  const currentPlan = user ? getEffectivePlan(user) : null;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <BrandLogo
            href="/"
            markClassName="h-8 w-8 sm:h-9 sm:w-9"
            className="shrink-0"
          />

          <div className="flex flex-1 flex-wrap items-center justify-end gap-x-4 gap-y-1 sm:gap-x-6 text-sm font-medium">
            {!user && (
              <>
                <Link
                  href="/"
                  className={
                    isActive('/')
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-primary-600'
                  }
                >
                  Home
                </Link>
                <Link
                  href="/login"
                  className={
                    pathname === '/login'
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-primary-600'
                  }
                >
                  Log in
                </Link>
              </>
            )}
            <Link
              href="/pricing"
              className={
                isActive('/pricing')
                  ? 'text-primary-600'
                  : 'text-gray-700 hover:text-primary-600'
              }
            >
              Pricing
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={
                    isActive('/dashboard')
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-primary-600'
                  }
                >
                  Dashboard
                </Link>
                <Link
                  href="/settings"
                  className={
                    pathname.startsWith('/settings')
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-primary-600'
                  }
                >
                  Settings
                </Link>
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {loading ? (
              <span className="text-sm text-gray-400" aria-hidden>
                …
              </span>
            ) : user ? (
              <>
                {currentPlan && (
                  <span
                    className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-800 ring-1 ring-inset ring-primary-200"
                    title="Current subscription"
                  >
                    {planDisplayName(currentPlan)}
                  </span>
                )}
                <Link
                  href="/settings"
                  className="hidden sm:inline max-w-[8rem] truncate text-sm text-gray-600 hover:text-primary-600"
                  title={user.email}
                >
                  {user.name}
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => void handleLogout()}
                >
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
