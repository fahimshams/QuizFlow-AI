/**
 * Admin Dashboard
 *
 * Analytics dashboard for developers/admins
 * Shows user stats, usage, revenue, and costs
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Toast } from '@/components/ui/Toast';
import api from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { useTokenExpiration } from '@/hooks/useTokenExpiration';
import { getCurrentUser } from '@/lib/auth';

interface AnalyticsData {
  users: {
    total: number;
    free: number;
    pro: number;
    active: number;
    newThisMonth: number;
    growth: number;
  };
  usage: {
    totalQuizzes: number;
    totalUploads: number;
    quizzesThisMonth: number;
    uploadsThisMonth: number;
    averageQuestionsPerQuiz: number;
  };
  revenue: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    activeSubscriptions: number;
    churnRate: number;
  };
  costs: {
    estimatedOpenAICost: number;
    stripeFees: number;
    totalCost: number;
  };
  trends: {
    userGrowth: Array<{ date: string; count: number }>;
    quizGeneration: Array<{ date: string; count: number }>;
    revenue: Array<{ date: string; amount: number }>;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    isOpen: false,
    message: '',
    type: 'success',
  });

  useTokenExpiration();

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await getCurrentUser();
        if (user && user.role === 'ADMIN') {
          setIsAuthorized(true);
        } else {
          setToast({
            isOpen: true,
            message: 'Access denied. Admin only.',
            type: 'error',
          });
          setTimeout(() => router.push('/dashboard'), 2000);
        }
      } catch (error) {
        setToast({
          isOpen: true,
          message: 'Failed to verify permissions',
          type: 'error',
        });
        setTimeout(() => router.push('/dashboard'), 2000);
      } finally {
        setIsChecking(false);
      }
    };

    checkAdmin();
  }, [router]);

  // Fetch analytics data
  const { data: analytics, isLoading, error, refetch } = useQuery<AnalyticsData>({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const response = await api.get('/admin/analytics');
      return response.data;
    },
    enabled: isAuthorized,
    refetchInterval: 60000, // Refetch every minute
  });

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load analytics</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const profit = analytics.revenue.monthlyRecurringRevenue - analytics.costs.totalCost;
  const profitMargin = analytics.revenue.monthlyRecurringRevenue > 0
    ? (profit / analytics.revenue.monthlyRecurringRevenue) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Analytics & Cost Overview</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {analytics.users.total}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {analytics.users.newThisMonth} new this month
                {analytics.users.growth > 0 && (
                  <span className="text-green-600 ml-2">
                    ↑ {analytics.users.growth.toFixed(1)}%
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Monthly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${analytics.revenue.monthlyRecurringRevenue.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {analytics.revenue.activeSubscriptions} active subscriptions
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Monthly Costs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                ${analytics.costs.totalCost.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                OpenAI: ${analytics.costs.estimatedOpenAICost.toFixed(2)} |
                Stripe: ${analytics.costs.stripeFees.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Net Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${
                profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${profit.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Margin: {profitMargin.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Free Users</span>
                  <span className="font-semibold">{analytics.users.free}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pro Users</span>
                  <span className="font-semibold">{analytics.users.pro}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Users (30d)</span>
                  <span className="font-semibold">{analytics.users.active}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Churn Rate</span>
                  <span className="font-semibold text-red-600">
                    {analytics.revenue.churnRate.toFixed(2)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Quizzes</span>
                  <span className="font-semibold">{analytics.usage.totalQuizzes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Quizzes This Month</span>
                  <span className="font-semibold">{analytics.usage.quizzesThisMonth}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Uploads</span>
                  <span className="font-semibold">{analytics.usage.totalUploads}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Questions/Quiz</span>
                  <span className="font-semibold">
                    {analytics.usage.averageQuestionsPerQuiz.toFixed(1)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">OpenAI API Costs</span>
                  <span className="font-semibold">
                    ${analytics.costs.estimatedOpenAICost.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(analytics.costs.estimatedOpenAICost / analytics.costs.totalCost) * 100}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Estimated based on {analytics.usage.totalQuizzes} quiz generations
                </p>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Stripe Fees</span>
                  <span className="font-semibold">
                    ${analytics.costs.stripeFees.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${(analytics.costs.stripeFees / analytics.costs.totalCost) * 100}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  2.9% + $0.30 per transaction
                </p>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total Monthly Cost</span>
                  <span className="text-lg font-bold text-red-600">
                    ${analytics.costs.totalCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Simple Trend Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Trend */}
          <Card>
            <CardHeader>
              <CardTitle>User Growth (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-1">
                {analytics.trends.userGrowth.slice(-7).map((point, index) => {
                  const maxCount = Math.max(
                    ...analytics.trends.userGrowth.map((p) => p.count),
                    1
                  );
                  const height = (point.count / maxCount) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-primary-600 rounded-t transition-all hover:bg-primary-700"
                        style={{ height: `${height}%` }}
                        title={`${point.count} users on ${new Date(point.date).toLocaleDateString()}`}
                      ></div>
                      <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                        {new Date(point.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quiz Generation Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Generation (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-1">
                {analytics.trends.quizGeneration.slice(-7).map((point, index) => {
                  const maxCount = Math.max(
                    ...analytics.trends.quizGeneration.map((p) => p.count),
                    1
                  );
                  const height = (point.count / maxCount) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-green-600 rounded-t transition-all hover:bg-green-700"
                        style={{ height: `${height}%` }}
                        title={`${point.count} quizzes on ${new Date(point.date).toLocaleDateString()}`}
                      ></div>
                      <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                        {new Date(point.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Cost estimates are based on OpenAI API pricing and Stripe fee structure.
            Actual costs may vary. Revenue is estimated based on active subscriptions.
          </p>
        </div>
      </div>

      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        message={toast.message}
        type={toast.type}
      />
    </div>
  );
}

