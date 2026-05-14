/**
 * Dashboard Page
 *
 * Main interface for authenticated users:
 * - Upload files
 * - View upload history
 * - Generate quizzes
 * - Download QTI packages
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { RequireAuth } from '@/components/RequireAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import api from '@/lib/axios';
import { quizDownloadUrl } from '@/lib/quizDownloadUrl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth-context';
import { PLAN_LIMITS, SubscriptionPlan } from '@quizflow/types';
import { getEffectivePlan } from '@/lib/subscription';

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const planTier =
    getEffectivePlan(user) === 'pro'
      ? SubscriptionPlan.PRO
      : SubscriptionPlan.FREE;
  const planLimits = PLAN_LIMITS[planTier];
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState('5');
  const [title, setTitle] = useState('');

  // Fetch user quizzes
  const { data: quizzes, isLoading: isLoadingQuizzes, refetch } = useQuery({
    queryKey: ['quizzes'],
    enabled: !!user && !authLoading,
    queryFn: async () => {
      const response = await api.get('/quiz');
      return response.data;
    },
  });

  const { data: uploads, isLoading: isLoadingUploads } = useQuery({
    queryKey: ['uploads'],
    enabled: !!user && !authLoading,
    queryFn: async () => {
      const response = await api.get('/upload');
      return response.data as Array<{
        id: string;
        originalName: string;
        status: string;
        createdAt: string;
      }>;
    },
  });

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['uploads'] });
      // After upload, generate quiz
      await generateQuizMutation.mutateAsync({
        fileId: data.fileId,
        questionCount: parseInt(questionCount),
        title,
      });
    },
  });

  // Generate quiz mutation
  const generateQuizMutation = useMutation({
    mutationFn: async (params: {
      fileId: string;
      questionCount: number;
      title?: string;
    }) => {
      const response = await api.post('/quiz', params);
      return response.data;
    },
    onSuccess: (payload: { quiz: { id: string } }) => {
      refetch();
      void queryClient.invalidateQueries({ queryKey: ['uploads'] });
      setSelectedFile(null);
      setTitle('');
      router.push(`/dashboard/quizzes/${payload.quiz.id}`);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      if (!title) {
        setTitle(e.target.files[0].name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      await uploadMutation.mutateAsync(selectedFile);
    } catch (error: unknown) {
      const err = error as { message?: string; statusCode?: number };
      alert(err.message || 'Failed to upload or generate quiz');
    }
  };

  const isLoading = uploadMutation.isPending || generateQuizMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <RequireAuth>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Upload lecture files and generate quizzes
          </p>
          {user ? (
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              <span className="font-medium text-slate-800">Usage caps (rolling 7 days):</span>{' '}
              {planLimits.uploadsPerWeek === 1
                ? '1 document upload'
                : `${planLimits.uploadsPerWeek} document uploads`}
              , {planLimits.quizGenerationsPerWeek} AI quiz runs (create or
              regenerate). Manual edits that only rebuild QTI do not use an AI
              run. Upload limits count{' '}
              <strong>completed documents</strong> in the last 7 days (see below)—
              not only quizzes, so a finished upload still counts even if quiz
              generation failed.
            </p>
          ) : null}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Create Quiz</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload File
                    </label>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.docx,.txt"
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary-50 file:text-primary-700
                        hover:file:bg-primary-100"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      PDF, DOCX, or TXT (max 10MB)
                    </p>
                    <p className="mt-2 text-xs text-amber-800 bg-amber-50 rounded-md p-2">
                      Each document can have one quiz. Open an existing quiz from
                      the list to edit answers or regenerate questions.
                    </p>
                  </div>

                  {selectedFile && (
                    <>
                      <Input
                        label="Quiz Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="My Quiz"
                      />

                      <Input
                        label="Number of Questions"
                        type="number"
                        min="1"
                        max="30"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(e.target.value)}
                      />

                      <Button
                        type="submit"
                        fullWidth
                        isLoading={isLoading}
                        disabled={!selectedFile}
                      >
                        Generate Quiz
                      </Button>
                    </>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Quiz History + documents */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Your documents</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingUploads ? (
                  <p className="text-center text-gray-500 py-4">Loading…</p>
                ) : !uploads || uploads.length === 0 ? (
                  <p className="text-center text-gray-500 py-4 text-sm">
                    No processed uploads yet. Successful uploads appear here and
                    count toward your weekly upload cap.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                    {uploads.map((u) => (
                      <li
                        key={u.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
                      >
                        <span className="font-medium text-gray-900 truncate max-w-[min(100%,18rem)]">
                          {u.originalName}
                        </span>
                        <span className="flex items-center gap-2 shrink-0">
                          <span
                            className={
                              u.status === 'COMPLETED'
                                ? 'rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800'
                                : u.status === 'FAILED'
                                  ? 'rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800'
                                  : 'rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900'
                            }
                          >
                            {u.status}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingQuizzes ? (
                  <p className="text-center text-gray-500 py-8">
                    Loading...
                  </p>
                ) : !quizzes || quizzes.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No quizzes yet. Upload a file to get started!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {quizzes.map((quiz: any) => {
                      const hrefZip = quizDownloadUrl(quiz);
                      return (
                        <div
                          key={quiz.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-wrap justify-between items-start gap-3">
                            <div>
                              <Link
                                href={`/dashboard/quizzes/${quiz.id}`}
                                className="font-semibold text-lg text-primary-700 hover:underline"
                              >
                                {quiz.title}
                              </Link>
                              <p className="text-sm text-gray-600">
                                {quiz.questionCount} questions •{' '}
                                {new Date(quiz.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Link
                                href={`/dashboard/quizzes/${quiz.id}`}
                                className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
                              >
                                Edit
                              </Link>
                              {hrefZip ? (
                                <a
                                  href={hrefZip}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                                >
                                  Download QTI
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </RequireAuth>
    </div>
  );
}

