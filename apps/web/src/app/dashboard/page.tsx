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
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import api from '@/lib/axios';
import { useQuery, useMutation } from '@tanstack/react-query';

export default function DashboardPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState('5');
  const [title, setTitle] = useState('');

  // Fetch user quizzes
  const { data: quizzes, isLoading: isLoadingQuizzes, refetch } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const response = await api.get('/quiz');
      return response.data;
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
    onSuccess: () => {
      refetch();
      setSelectedFile(null);
      setTitle('');
      alert('Quiz generated successfully!');
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
    } catch (error: any) {
      alert(error.message || 'Failed to upload file');
    }
  };

  const isLoading = uploadMutation.isPending || generateQuizMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Upload lecture files and generate quizzes
          </p>
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

          {/* Quiz History */}
          <div className="lg:col-span-2">
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
                    {quizzes.map((quiz: any) => (
                      <div
                        key={quiz.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {quiz.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {quiz.questionCount} questions •{' '}
                              {new Date(quiz.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <a
                            href={quiz.qtiFileUrl}
                            download
                            className="btn btn-primary btn-sm"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

