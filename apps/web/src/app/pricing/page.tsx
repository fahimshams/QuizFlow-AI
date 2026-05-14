/**
 * Pricing Page
 */

'use client';

import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/components/auth-context';
import { getEffectivePlan } from '@/lib/subscription';
import { PLAN_LIMITS, SubscriptionPlan } from '@quizflow/types';

const FREE = PLAN_LIMITS[SubscriptionPlan.FREE];
const PRO = PLAN_LIMITS[SubscriptionPlan.PRO];

export default function PricingPage() {
  const { user, loading } = useAuth();
  const plan = !loading && user ? getEffectivePlan(user) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the plan that fits your needs
          </p>
          {user && plan && (
            <p className="mt-4 text-sm font-medium text-primary-700">
              Your current plan:{' '}
              <span className="capitalize">{plan}</span>
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="relative">
            {plan === 'free' && (
              <div className="absolute top-0 right-0 rounded-bl-lg bg-green-600 px-3 py-1 text-sm font-medium text-white">
                Subscribed
              </div>
            )}
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
                  <span>
                    {FREE.uploadsPerWeek} upload per rolling week (per processed
                    document)
                  </span>
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
                  <span>
                    {FREE.quizGenerationsPerWeek} AI quiz runs per rolling week
                    (create + regenerate)
                  </span>
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
                  <span>{FREE.questionsPerQuiz} questions per quiz</span>
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
                  <span className="text-gray-500">Includes watermark</span>
                </li>
              </ul>
              {plan === 'free' ? (
                <Button fullWidth variant="secondary" disabled>
                  Subscribed
                </Button>
              ) : plan === 'pro' ? (
                <Button fullWidth variant="outline" disabled>
                  Your plan is Pro
                </Button>
              ) : (
                <Link href="/register">
                  <Button fullWidth variant="outline">
                    Get Started
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-2 border-primary-500">
            {plan === 'pro' ? (
              <div className="absolute top-0 right-0 rounded-bl-lg bg-green-600 px-3 py-1 text-sm font-medium text-white">
                Subscribed
              </div>
            ) : (
              <div className="absolute top-0 right-0 rounded-bl-lg bg-primary-500 px-3 py-1 text-sm font-medium text-white">
                Popular
              </div>
            )}
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
                  <span className="font-medium">
                    {PRO.uploadsPerWeek} document uploads per rolling week
                  </span>
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
                  <span className="font-medium">
                    {PRO.quizGenerationsPerWeek} AI quiz runs per rolling week
                  </span>
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
                  <span className="font-medium">
                    Up to {PRO.questionsPerQuiz} questions per quiz
                  </span>
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
              {plan === 'pro' ? (
                <Button fullWidth variant="secondary" disabled>
                  Subscribed
                </Button>
              ) : (
                <Link href={user ? '/dashboard' : '/register'}>
                  <Button fullWidth>Upgrade to Pro</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can cancel your subscription at any time. You&apos;ll
                continue to have access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How do upload and AI limits work?
              </h3>
              <p className="text-gray-600">
                Limits use a <strong>rolling 7-day window</strong> (not the
                calendar week). Each processed document upload counts toward your
                upload cap. Each AI quiz <em>creation</em> or <em>regeneration</em>{' '}
                counts toward your AI run cap. Saving edited questions and
                rebuilding QTI without new AI does not consume an AI run.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What file formats are supported?
              </h3>
              <p className="text-gray-600">
                We support PDF, DOCX, and TXT files up to 10MB each.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
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
