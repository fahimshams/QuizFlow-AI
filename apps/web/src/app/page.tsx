/**
 * Landing Page
 *
 * MARKETING PAGE BEST PRACTICES:
 * - Clear value proposition
 * - Social proof
 * - Strong CTA
 * - Feature highlights
 * - Simple, scannable layout
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { isAuthenticated } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Transform Lectures into
            <span className="text-primary-600"> AI-Powered Quizzes</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Upload your lecture materials and let AI generate Canvas LMS-compatible
            quizzes in seconds. Save hours of manual work.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>

        {/* Demo Video/Screenshot Placeholder */}
        <div className="mt-16 rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-gray-200 aspect-video flex items-center justify-center">
            <p className="text-gray-500 text-lg">📹 Demo Video / Screenshot</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card hover className="text-center">
            <CardContent>
              <div className="text-4xl mb-4">📄</div>
              <CardTitle className="mb-2">1. Upload</CardTitle>
              <p className="text-gray-600">
                Upload your lecture files (PDF, DOCX, or TXT)
              </p>
            </CardContent>
          </Card>

          <Card hover className="text-center">
            <CardContent>
              <div className="text-4xl mb-4">🤖</div>
              <CardTitle className="mb-2">2. Generate</CardTitle>
              <p className="text-gray-600">
                AI analyzes content and creates quiz questions
              </p>
            </CardContent>
          </Card>

          <Card hover className="text-center">
            <CardContent>
              <div className="text-4xl mb-4">📥</div>
              <CardTitle className="mb-2">3. Export</CardTitle>
              <p className="text-gray-600">
                Download QTI format ready for Canvas LMS
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose QuizFlow AI?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Save Time</h3>
                <p className="text-gray-600">
                  Generate quizzes in minutes instead of hours. Focus on teaching,
                  not quiz creation.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">High Quality</h3>
                <p className="text-gray-600">
                  Powered by GPT-4, ensuring accurate and relevant questions
                  based on your content.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🔌</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Canvas Compatible</h3>
                <p className="text-gray-600">
                  Export to QTI 2.1 format for seamless import into Canvas LMS
                  and other platforms.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Free to Start</h3>
                <p className="text-gray-600">
                  Try it free with 1 upload per week. Upgrade to Pro for unlimited
                  access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-primary-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of educators saving time with AI-powered quiz generation
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2024 QuizFlow AI. All rights reserved.
            </p>
            <div className="mt-4 space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

