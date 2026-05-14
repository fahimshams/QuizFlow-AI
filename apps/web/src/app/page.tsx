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

import Link from 'next/link';
import {
  Download,
  FileText,
  MonitorPlay,
  Plug2,
  Sparkles,
  Target,
  WalletCards,
  Zap,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';

export default function HomePage() {
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Log in
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-600">
            New here?{' '}
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-700">
              Create an account
            </Link>
            {' · '}
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Log in to your dashboard
            </Link>
          </p>
        </div>

        {/* Demo Video/Screenshot Placeholder */}
        <div className="mt-16 rounded-2xl shadow-xl overflow-hidden border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-primary-50">
          <div className="aspect-video flex flex-col items-center justify-center gap-4 px-6">
            <div className="rounded-full bg-primary-100 p-5 ring-8 ring-primary-50/80">
              <MonitorPlay className="h-14 w-14 text-primary-600" strokeWidth={1.25} />
            </div>
            <p className="text-slate-600 text-center text-lg font-medium max-w-md">
              Product walkthrough
            </p>
            <p className="text-slate-500 text-sm text-center max-w-lg">
              Add a short demo video or screenshot here when you have one.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card hover className="text-center border-slate-100 shadow-sm">
            <CardContent className="pt-8 pb-8">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                <FileText className="h-7 w-7" strokeWidth={1.75} />
              </div>
              <CardTitle className="mb-2">1. Upload</CardTitle>
              <p className="text-gray-600">
                Upload your lecture files (PDF, DOCX, or TXT)
              </p>
            </CardContent>
          </Card>

          <Card hover className="text-center border-slate-100 shadow-sm">
            <CardContent className="pt-8 pb-8">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                <Sparkles className="h-7 w-7" strokeWidth={1.75} />
              </div>
              <CardTitle className="mb-2">2. Generate</CardTitle>
              <p className="text-gray-600">
                AI analyzes content and creates quiz questions
              </p>
            </CardContent>
          </Card>

          <Card hover className="text-center border-slate-100 shadow-sm">
            <CardContent className="pt-8 pb-8">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                <Download className="h-7 w-7" strokeWidth={1.75} />
              </div>
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
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose QuizFlow AI?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-700">
                  <Zap className="h-6 w-6" strokeWidth={1.75} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Save Time</h3>
                <p className="text-gray-600">
                  Generate quizzes in minutes instead of hours. Focus on teaching,
                  not quiz creation.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-700">
                  <Target className="h-6 w-6" strokeWidth={1.75} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">High Quality</h3>
                <p className="text-gray-600">
                  Powered by GPT-4, ensuring accurate and relevant questions
                  based on your content.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-700">
                  <Plug2 className="h-6 w-6" strokeWidth={1.75} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Canvas Compatible</h3>
                <p className="text-gray-600">
                  Export to QTI 2.1 format for seamless import into Canvas LMS
                  and other platforms.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-700">
                  <WalletCards className="h-6 w-6" strokeWidth={1.75} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Predictable plans</h3>
                <p className="text-gray-600">
                  Start free with weekly limits. Pro raises caps for uploads and AI
                  quiz generations—designed for real classroom volume, not open-ended
                  abuse.
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button size="lg" variant="secondary">
                Create Free Account
              </Button>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border-2 border-white px-6 py-3 text-base font-semibold text-white hover:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2026 QuizFlow AI. All rights reserved.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
              <Link href="/login" className="text-gray-300 hover:text-white font-medium">
                Log in
              </Link>
              <Link href="/register" className="text-gray-300 hover:text-white font-medium">
                Sign up
              </Link>
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

