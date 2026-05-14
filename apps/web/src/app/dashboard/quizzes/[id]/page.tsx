'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { RequireAuth } from '@/components/RequireAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import api from '@/lib/axios';
import { quizDownloadUrl } from '@/lib/quizDownloadUrl';
import { useAuth } from '@/components/auth-context';

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
};

type QuizPayload = {
  id: string;
  title: string;
  questions: QuizQuestion[];
  questionCount: number;
  qtiFilePath?: string | null;
  qtiFileUrl?: string | null;
  fileUpload?: { originalName: string };
};

export default function QuizEditorPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = typeof params.id === 'string' ? params.id : params.id?.[0];
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [regenCount, setRegenCount] = useState('5');

  const { data, isLoading, error } = useQuery({
    queryKey: ['quiz', quizId],
    enabled: !!user && !authLoading && !!quizId,
    queryFn: async () => {
      const res = await api.get(`/quiz/${quizId}`);
      return res.data as QuizPayload;
    },
  });

  useEffect(() => {
    if (!data) return;
    setTitle(data.title);
    const qs = Array.isArray(data.questions)
      ? (data.questions as QuizQuestion[])
      : [];
    setQuestions(
      qs.map((q) => ({
        question: q.question ?? '',
        options: Array.isArray(q.options) ? [...q.options] : ['', ''],
        correctAnswer: q.correctAnswer ?? '',
        explanation: q.explanation ?? '',
      }))
    );
    setRegenCount(String(Math.max(1, data.questionCount || qs.length || 5)));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/quiz/${quizId}`, {
        title: title.trim() || undefined,
        questions,
      });
      return res.data as { quiz: QuizPayload; downloadUrl: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      alert('Quiz saved and QTI package updated.');
    },
    onError: (err: { message?: string }) => {
      alert(err.message || 'Save failed');
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const n = parseInt(regenCount, 10);
      const res = await api.post(`/quiz/${quizId}/regenerate`, {
        questionCount: Number.isFinite(n) ? n : undefined,
      });
      return res.data as { quiz: QuizPayload; downloadUrl: string };
    },
    onSuccess: (payload) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      const qs = payload.quiz.questions as QuizQuestion[];
      setQuestions(
        qs.map((q) => ({
          question: q.question ?? '',
          options: Array.isArray(q.options) ? [...q.options] : ['', ''],
          correctAnswer: q.correctAnswer ?? '',
          explanation: q.explanation ?? '',
        }))
      );
      setTitle(payload.quiz.title);
    },
    onError: (err: { message?: string }) => {
      alert(err.message || 'Regeneration failed');
    },
  });

  const updateQuestion = useCallback(
    (index: number, patch: Partial<QuizQuestion>) => {
      setQuestions((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], ...patch };
        return next;
      });
    },
    []
  );

  const updateOption = useCallback((qIndex: number, optIndex: number, value: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const opts = [...next[qIndex].options];
      opts[optIndex] = value;
      next[qIndex] = { ...next[qIndex], options: opts };
      return next;
    });
  }, []);

  const addOption = useCallback((qIndex: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[qIndex] = {
        ...next[qIndex],
        options: [...next[qIndex].options, ''],
      };
      return next;
    });
  }, []);

  const removeOption = useCallback((qIndex: number, optIndex: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      const opts = next[qIndex].options.filter((_, i) => i !== optIndex);
      if (opts.length < 2) return prev;
      let correct = next[qIndex].correctAnswer;
      if (!opts.includes(correct)) {
        correct = opts[0] ?? '';
      }
      next[qIndex] = { ...next[qIndex], options: opts, correctAnswer: correct };
      return next;
    });
  }, []);

  const downloadHref = data ? quizDownloadUrl(data) : '';

  if (!quizId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <RequireAuth>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex flex-wrap items-center gap-4 justify-between">
            <div>
              <Link
                href="/dashboard"
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                ← Back to dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                Edit quiz
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {downloadHref ? (
                <a
                  href={downloadHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Download QTI
                </a>
              ) : null}
              <Button
                variant="secondary"
                onClick={() => router.push('/dashboard')}
              >
                Close
              </Button>
            </div>
          </div>

          {isLoading ? (
            <p className="text-gray-600">Loading quiz…</p>
          ) : error ? (
            <p className="text-red-600">Could not load this quiz.</p>
          ) : (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Quiz details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  {data?.fileUpload?.originalName ? (
                    <p className="text-sm text-gray-600">
                      Source document:{' '}
                      <span className="font-medium">
                        {data.fileUpload.originalName}
                      </span>
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-4 items-end">
                    <Input
                      label="Questions for AI regenerate"
                      type="number"
                      min={1}
                      max={30}
                      value={regenCount}
                      onChange={(e) => setRegenCount(e.target.value)}
                      className="max-w-[160px]"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      isLoading={regenerateMutation.isPending}
                      onClick={() => regenerateMutation.mutate()}
                    >
                      Regenerate with AI
                    </Button>
                    <Button
                      type="button"
                      isLoading={saveMutation.isPending}
                      onClick={() => saveMutation.mutate()}
                    >
                      Save changes
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Regenerating uses your weekly AI generation allowance on the
                    Free plan. Saving edits rebuilds the QTI file without a new
                    generation credit.
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-6">
                {questions.map((q, qi) => (
                  <Card key={qi}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Question {qi + 1}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prompt
                        </label>
                        <textarea
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[80px]"
                          value={q.question}
                          onChange={(e) =>
                            updateQuestion(qi, { question: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-gray-700">
                          Options
                        </span>
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex gap-2">
                            <input
                              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              value={opt}
                              onChange={(e) =>
                                updateOption(qi, oi, e.target.value)
                              }
                              placeholder={`Option ${oi + 1}`}
                            />
                            {q.options.length > 2 ? (
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => removeOption(qi, oi)}
                              >
                                Remove
                              </Button>
                            ) : null}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => addOption(qi)}
                        >
                          Add option
                        </Button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Correct answer (must match an option exactly)
                        </label>
                        <select
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          value={
                            q.options.includes(q.correctAnswer)
                              ? q.correctAnswer
                              : q.options[0] || ''
                          }
                          onChange={(e) =>
                            updateQuestion(qi, {
                              correctAnswer: e.target.value,
                            })
                          }
                        >
                          {q.options.map((opt, oi) => (
                            <option key={oi} value={opt}>
                              {opt || `(empty ${oi + 1})`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Explanation (optional)
                        </label>
                        <textarea
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[60px]"
                          value={q.explanation ?? ''}
                          onChange={(e) =>
                            updateQuestion(qi, {
                              explanation: e.target.value,
                            })
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </RequireAuth>
    </div>
  );
}
