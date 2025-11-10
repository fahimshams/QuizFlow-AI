/**
 * Upgrade to Pro Page
 *
 * Dedicated page for upgrading to Pro plan
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { getCurrentUser, isAuthenticated } from '@/lib/auth';
import api from '@/lib/axios';

export default function UpgradePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = isAuthenticated();

      if (!authStatus) {
        // Redirect to login if not authenticated
        router.push('/login');
        return;
      }

      const userData = await getCurrentUser();
      setUser(userData);

      // If already Pro, redirect to dashboard
      if (userData?.plan === 'PRO') {
        router.push('/dashboard');
        return;
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      // TEST MODE: Direct upgrade without Stripe payment
      // TODO: Switch to real Stripe checkout when ready
      const response: any = await api.post('/subscription/upgrade-test');

      console.log('Upgrade response:', response);

      // Show success message
      const message = response?.message || 'Successfully upgraded to Pro!';
      alert('🎉 ' + message + '\n\nYou now have access to all Pro features!');

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

    } catch (error: any) {
      console.error('Upgrade error:', error);
      alert(error.message || 'Failed to upgrade. Please try again.');
      setIsUpgrading(false);
    }
  };

  // For production, use this instead:
  /*
  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const response: any = await api.post('/subscription/checkout', {
        successUrl: `${window.location.origin}/dashboard?upgrade=success`,
        cancelUrl: `${window.location.origin}/upgrade?canceled=true`,
      });

      if (response?.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      alert(error.message || 'Failed to create checkout session. Please try again.');
      setIsUpgrading(false);
    }
  };
  */

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
              Current Plan: Free
            </span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Upgrade to <span className="text-primary-600">Pro</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock unlimited quizzes, more questions, and premium features to supercharge your workflow
          </p>
        </div>

        {/* Comparison Card */}
        <Card className="mb-8 border-2 border-primary-200 shadow-xl">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Current Plan */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-700">Your Current Plan</h3>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                    Free
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-gray-700 font-medium">5 uploads per month</p>
                      <p className="text-sm text-gray-500">Limited uploads</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-gray-700 font-medium">5 questions per quiz</p>
                      <p className="text-sm text-gray-500">Basic quizzes only</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-gray-700 font-medium">Includes watermark</p>
                      <p className="text-sm text-gray-500">QuizFlow branding</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pro Plan */}
              <div className="space-y-6 bg-gradient-to-br from-primary-50 to-purple-50 p-6 rounded-lg border-2 border-primary-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-primary-900">Upgrade to Pro</h3>
                  <span className="px-3 py-1 bg-primary-600 text-white rounded-full text-sm font-semibold">
                    ✨ Pro
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-gray-900 font-bold">Unlimited uploads</p>
                      <p className="text-sm text-gray-700">Upload as many files as you need</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-gray-900 font-bold">30 questions per quiz</p>
                      <p className="text-sm text-gray-700">Create comprehensive assessments</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-gray-900 font-bold">No watermark</p>
                      <p className="text-sm text-gray-700">Professional, branded quizzes</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-gray-900 font-bold">Priority support</p>
                      <p className="text-sm text-gray-700">Get help when you need it</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-2xl shadow-lg p-8 border-2 border-primary-300">
            <div className="mb-4">
              <span className="text-5xl font-bold text-gray-900">$19</span>
              <span className="text-xl text-gray-600">/month</span>
            </div>
            <p className="text-gray-600 mb-6">Cancel anytime • No hidden fees</p>
            <Button
              size="lg"
              className="px-12 py-4 text-lg"
              onClick={handleUpgrade}
              disabled={isUpgrading}
            >
              {isUpgrading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Upgrade to Pro Now
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Save Time</h3>
              <p className="text-gray-600 text-sm">
                Generate unlimited quizzes instantly and focus on teaching, not quiz creation
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="font-bold text-lg mb-2">More Questions</h3>
              <p className="text-gray-600 text-sm">
                Create comprehensive assessments with up to 30 questions per quiz
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Professional</h3>

            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">
                  Can I cancel anytime?
                </h3>
                <p className="text-gray-600">
                  Yes! You can cancel your subscription at any time from your dashboard. You'll continue to have Pro access until the end of your billing period.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">
                  What happens to my existing quizzes if I upgrade?
                </h3>
                <p className="text-gray-600">
                  All your existing quizzes remain intact. You'll immediately get access to create new quizzes with more questions.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">
                  Is the payment secure?
                </h3>
                <p className="text-gray-600">
                  Absolutely! We use Stripe for payment processing, which is the same payment provider used by companies like Amazon, Google, and Microsoft.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Still have questions? <a href="mailto:support@quizflow.ai" className="text-primary-600 hover:text-primary-700 font-semibold">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  );
}

