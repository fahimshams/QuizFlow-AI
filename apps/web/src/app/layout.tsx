import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'QuizFlow AI - AI-Powered Quiz Generator for Canvas LMS',
  description:
    'Transform your lecture materials into Canvas-compatible quizzes with AI. Upload PDFs, DOCX, or TXT files and generate QTI-format quizzes instantly.',
  keywords: [
    'quiz generator',
    'Canvas LMS',
    'QTI',
    'AI quiz',
    'education',
    'e-learning',
  ],
  authors: [{ name: 'QuizFlow AI' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://quizflow.ai',
    siteName: 'QuizFlow AI',
    title: 'QuizFlow AI - AI-Powered Quiz Generator',
    description:
      'Transform lecture materials into Canvas-compatible quizzes with AI',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

