/**
 * Subscription Management Page
 *
 * Allows users to:
 * - View current plan details
 * - Manage billing through Stripe portal
 * - Cancel subscription
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { Toast } from '@/components/ui/Toast';
import api from '@/lib/axios';
import { getCurrentUser } from '@/lib/auth';

export default function SubscriptionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>('FREE');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Dialog state
  const [cancelDialog, setCancelDialog] = useState(false);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setUserPlan(user.plan || 'FREE');
        setSubscriptionStatus(user.subscriptionStatus || null);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setToast({
          isOpen: true,
          message: 'Failed to load subscription details',
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleManageBilling = async () => {
    setIsProcessing(true);

    // TEST MODE: Show info message instead of opening Stripe portal
    // TODO: Switch to real Stripe portal when ready
    alert('📋 TEST MODE\n\nIn production, this would open the Stripe billing portal where you can:\n- Update payment methods\n- View invoices\n- Update billing information');
    setIsProcessing(false);

    /* For production, use this:
    try {
      const response: any = await api.post('/subscription/portal', {
        returnUrl: `${window.location.origin}/subscription`,
      });

      if (response?.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      setToast({
        isOpen: true,
        message: error.message || 'Failed to open billing portal',
        type: 'error',
      });
      setIsProcessing(false);
    }
    */
  };

  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    try {
      // TEST MODE: Direct downgrade without Stripe
      // TODO: Switch to real Stripe cancellation when ready
      const response: any = await api.post('/subscription/downgrade-test');

      setToast({
        isOpen: true,
        message: response?.message || 'Downgraded to Free plan',
        type: 'success',
      });

      setCancelDialog(false);

      // Refresh user data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Cancel error:', error);
      setToast({
        isOpen: true,
        message: error.message || 'Failed to cancel subscription',
        type: 'error',
      });
      setIsProcessing(false);
    }
  };

  /* For production, use this for cancellation:
  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    try {
      const response: any = await api.post('/subscription/cancel');

      setToast({
        isOpen: true,
        message: response?.message || 'Subscription canceled successfully',
        type: 'success',
      });

      setCancelDialog(false);

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Cancel error:', error);
      setToast({
        isOpen: true,
        message: error.message || 'Failed to cancel subscription',
        type: 'error',
      });
      setIsProcessing(false);
    }
  };
  */

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading subscription details...</p>
          </div>
        </div>
      </div>
    );
  }

  const isPro = userPlan === 'PRO';
  const isCanceling = subscriptionStatus === 'canceling';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Subscription Management
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Manage your QuizFlow AI subscription and billing
        </p>

        {/* Current Plan Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Plan</span>
              <span className={`px-4 py-2 rounded-full font-bold text-white ${
                isPro ? 'bg-primary-600' : 'bg-gray-500'
              }`}>
                {isPro ? '✨ PRO' : 'FREE'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isPro ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-green-700 bg-green-50 p-4 rounded-lg">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-semibold">Pro Plan Active</p>
                    <p className="text-sm text-green-600">
                      You have access to all Pro features
                    </p>
                  </div>
                </div>

                {isCanceling && (
                  <div className="flex items-start gap-3 text-orange-700 bg-orange-50 p-4 rounded-lg">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="font-semibold">Subscription Canceling</p>
                      <p className="text-sm text-orange-600">
                        Your subscription will end at the end of your current billing period. You'll have access to Pro features until then.
                      </p>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Pro Features</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Unlimited uploads per month
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Up to 30 questions per quiz
                    </li>
       
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Priority support
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Free Plan Features</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="text-gray-400">•</span>
                      5 uploads per month
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gray-400">•</span>
                      5 questions per quiz
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gray-400">•</span>
                      Includes watermark on quizzes
                    </li>
                  </ul>
                </div>

                <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
                  <p className="text-primary-900 font-semibold mb-2">
                    Want more features?
                  </p>

                  <Button
                    variant="primary"
                    onClick={() => router.push('/upgrade')}
                  >
                    ✨ Upgrade to Pro
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing Management Card */}
        {isPro && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Billing & Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Manage your payment methods, view invoices, and update billing information through Stripe's secure portal.
                </p>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={handleManageBilling}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Opening...' : '💳 Manage Billing'}
                  </Button>

                  {!isCanceling && (
                    <Button
                      variant="outline"
                      onClick={() => setCancelDialog(true)}
                      disabled={isProcessing}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              If you have any questions about your subscription or billing, please don't hesitate to reach out to our support team.
            </p>
            <Button variant="outline" onClick={() => window.location.href = 'mailto:support@quizflow.ai'}>
              📧 Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        isOpen={cancelDialog}
        onClose={() => !isProcessing && setCancelDialog(false)}
        title="Cancel Subscription?"
        onConfirm={handleCancelSubscription}
        confirmText={isProcessing ? 'Canceling...' : 'Yes, Cancel'}
        cancelText="Keep Subscription"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
      >
        <div className="space-y-3">
          <p className="text-gray-700">
            Are you sure you want to cancel your Pro subscription?
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> You'll continue to have access to Pro features until the end of your current billing period. After that, your account will be downgraded to the Free plan.
            </p>
          </div>
        </div>
      </Dialog>

      {/* Toast Notifications */}
      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        message={toast.message}
        type={toast.type}
      />
    </div>
  );
}

