/**
 * Navigation Bar Component
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui/Button';

export function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

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
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
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
          </div>
        </div>
      </div>
    </nav>
  );
}

