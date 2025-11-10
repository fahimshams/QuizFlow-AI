/**
 * Pricing Page
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { getCurrentUser, isAuthenticated } from '@/lib/auth';
import api from '@/lib/axios';

export default function PricingPage() {
  const [user, setUser] = useState<any>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = isAuthenticated();
      setIsAuth(authStatus);

      if (authStatus) {
        const userData = await getCurrentUser();
        setUser(userData);
      }
      setIsLoading(false);
    };

    checkAuth();

    // Check for upgrade status in URL
    const urlParams = new URLSearchParams(window.location.search);
    const upgradeStatus = urlParams.get('upgrade');

    if (upgradeStatus === 'success') {
      setTimeout(() => {
        alert('🎉 Successfully upgraded to Pro! Please refresh to see your new features.');
        // Remove the query parameter
        window.history.replaceState({}, '', '/pricing');
      }, 500);
    } else if (upgradeStatus === 'cancelled') {
      setTimeout(() => {
        alert('Upgrade cancelled. You can upgrade anytime!');
        window.history.replaceState({}, '', '/pricing');
      }, 500);
    }
  }, []);

  const handleUpgradeToPro = async () => {
    if (!isAuth) {
      window.location.href = '/register';
      return;
    }

    // Redirect to upgrade page for test mode
    window.location.href = '/upgrade';

    /* For production, use this:
    setIsUpgrading(true);
    try {
      const response = await api.post('/subscription/checkout', {
        successUrl: `${window.location.origin}/dashboard?upgrade=success`,
        cancelUrl: `${window.location.origin}/pricing?upgrade=cancelled`,
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to start checkout. Please try again.');
      setIsUpgrading(false);
    }
    */
  };

  const isPro = user?.plan === 'PRO';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the plan that fits your needs
          </p>
          {isAuth && user && (
            <div className="mt-6 inline-block">
              <div className={`px-6 py-3 rounded-full ${
                isPro
                  ? 'bg-primary-100 text-primary-800 border-2 border-primary-500'
                  : 'bg-gray-100 text-gray-800 border-2 border-gray-300'
              }`}>
                <span className="font-semibold">
                  Current Plan: {isPro ? '✨ Pro' : 'Free'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>1 upload per week</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>5 questions per quiz</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>QTI 2.1 export</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-6 h-6 text-gray-400 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span className="text-gray-500">
                    Includes watermark
                  </span>
                </li>
              </ul>
              {isLoading ? (
                <Button fullWidth variant="outline" disabled>
                  Loading...
                </Button>
              ) : !isAuth ? (
                <Link href="/register">
                  <Button fullWidth variant="outline">
                    Get Started
                  </Button>
                </Link>
              ) : !isPro ? (
                <Button fullWidth variant="outline" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button fullWidth variant="outline" disabled>
                  ✓ Your Plan
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-2 border-primary-500">
            <div className="absolute top-0 right-0 bg-primary-500 text-white px-3 py-1 text-sm font-medium rounded-bl-lg">
              Popular
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">$19</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-medium">Unlimited uploads</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-medium">30 questions per quiz</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-medium">No watermark</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-medium">Priority support</span>
                </li>
              </ul>
              {isLoading ? (
                <Button fullWidth disabled>
                  Loading...
                </Button>
              ) : isPro ? (
                <Button fullWidth disabled>
                  ✓ Current Plan
                </Button>
              ) : isAuth ? (
                <Button
                  fullWidth
                  onClick={handleUpgradeToPro}
                  disabled={isUpgrading}
                >
                  {isUpgrading ? 'Redirecting...' : 'Upgrade to Pro'}
                </Button>
              ) : (
                <Link href="/register">
                  <Button fullWidth>
                    Get Started
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can cancel your subscription at any time. You'll continue
                to have access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                What file formats are supported?
              </h3>
              <p className="text-gray-600">
                We support PDF, DOCX, and TXT files up to 10MB each.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Is the QTI format compatible with my LMS?
              </h3>
              <p className="text-gray-600">
                Yes! We generate QTI 2.1 format which is compatible with Canvas,
                Blackboard, Moodle, and most other LMS platforms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

