/**
 * Navigation Bar Component
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import { isAuthenticated, logout } from '@/lib/auth';
import { useTokenExpiration } from '@/hooks/useTokenExpiration';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('FREE');
  const [userRole, setUserRole] = useState<string>('USER');

  // Monitor token expiration
  useTokenExpiration();

  // Set isClient to true after mount and check auth (for hydration)
  useEffect(() => {
    setIsClient(true);
    setIsAuth(isAuthenticated());

    // Fetch user plan
    const fetchUserPlan = async () => {
      if (isAuthenticated()) {
        try {
          const user = await import('@/lib/auth').then(m => m.getCurrentUser());
          if (user) {
            setUserPlan(user.plan || 'FREE');
            setUserRole(user.role || 'USER');
          }
        } catch (error) {
          console.error('Error fetching user plan:', error);
        }
      }
    };
    fetchUserPlan();
  }, []);

  // Listen for auth-logout event from axios interceptor
  useEffect(() => {
    const handleAuthLogout = () => {
      setIsAuth(false);
      // Don't redirect here, the axios interceptor already handles it
    };

    window.addEventListener('auth-logout', handleAuthLogout);
    return () => window.removeEventListener('auth-logout', handleAuthLogout);
  }, []);

  // Check authentication status when pathname changes
  useEffect(() => {
    if (isClient) {
      const authStatus = isAuthenticated();
      setIsAuth(authStatus);

      // If not authenticated and on protected page, redirect to login
      const protectedRoutes = ['/dashboard', '/upgrade'];
      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

      if (!authStatus && isProtectedRoute) {
        router.push('/login');
      }
    }
  }, [pathname, isClient, router]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    await logout();
    setIsAuth(false);
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 text-2xl font-bold text-primary-600"
          >
            <span>✨</span>
            <span>QuizFlow AI</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'text-primary-600'
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              Home
            </Link>
            {!isAuth && (
              <Link
                href="/pricing"
                className={`text-sm font-medium transition-colors ${
                  isActive('/pricing')
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                Pricing
              </Link>
            )}
            {isAuth && (
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Auth Buttons / User Menu */}
          <div className="flex items-center space-x-4">
            {!isClient ? (
              // Show skeleton loader during hydration
              <div className="flex items-center space-x-4">
                <div className="w-16 h-9 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-24 h-9 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : isAuth ? (
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-primary-600 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
                    <span>👤</span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Dashboard
                    </Link>
                    {userRole === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        📊 Admin Dashboard
                      </Link>
                    )}
                    <Link
                      href="/subscription"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      💳 Subscription
                    </Link>
                    {userPlan !== 'PRO' && (
                      <Link
                        href="/upgrade"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        ✨ Upgrade to Pro
                      </Link>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
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

