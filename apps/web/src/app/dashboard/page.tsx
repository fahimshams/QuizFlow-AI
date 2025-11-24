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

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { Toast } from '@/components/ui/Toast';
import api from '@/lib/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTokenExpiration } from '@/hooks/useTokenExpiration';

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState('5');
  const [title, setTitle] = useState('');
  const [filename, setFilename] = useState('');
  const [currentPlan, setCurrentPlan] = useState<string>('FREE');
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);

  // Monitor token expiration
  useTokenExpiration();

  // Dialog and Toast states
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; quizId: string; quizTitle: string }>({
    isOpen: false,
    quizId: '',
    quizTitle: '',
  });
  const [uploadLimitDialog, setUploadLimitDialog] = useState(false);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false,
    message: '',
    type: 'success',
  });

  // Question Preview Dialog
  const [previewDialog, setPreviewDialog] = useState<{
    isOpen: boolean;
    questions: any[];
    quizId: string;
    fileUploadId: string;
    title: string;
    filename: string;
    originalFilename: string; // Track original filename for comparison
    questionCount: number;
  }>({
    isOpen: false,
    questions: [],
    quizId: '',
    fileUploadId: '',
    title: '',
    filename: '',
    originalFilename: '',
    questionCount: 0,
  });

  // Question editing state
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [editedQuestions, setEditedQuestions] = useState<any[]>([]);
  const [isReplacingQuestion, setIsReplacingQuestion] = useState<number | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  // Listen for auth-logout event from axios interceptor
  useEffect(() => {
    const handleAuthLogout = () => {
      // Redirect to login when logged out due to token expiration
      router.push('/login');
    };

    window.addEventListener('auth-logout', handleAuthLogout);
    return () => window.removeEventListener('auth-logout', handleAuthLogout);
  }, [router]);

  // Fetch current user plan
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const user = await import('@/lib/auth').then(m => m.getCurrentUser());
        if (user) {
          setCurrentPlan(user.plan || 'FREE');
        }
      } catch (error) {
        console.error('Error fetching user plan:', error);
      }
    };
    fetchUserPlan();
  }, []);

  // Fetch user quizzes
  const { data: quizzes = [], isLoading: isLoadingQuizzes, isError, refetch } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      try {
        const response = await api.get('/quiz');
        console.log('Quiz API full response:', response);
        console.log('Quiz data:', response.data);
        // axios interceptor already returns response.data, so response is { success, data }
        // and response.data contains the actual quiz array
        if (Array.isArray(response.data)) {
          return response.data;
        }
        console.warn('Quiz data is not an array:', response.data);
        return [];
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        throw error; // Let React Query handle the error
      }
    },
  });

  // Delete quiz mutation
  const deleteQuizMutation = useMutation({
    mutationFn: async (quizId: string) => {
      // Set deleting state for animation
      setDeletingQuizId(quizId);
      const response = await api.delete(`/quiz/${quizId}`);
      return response.data;
    },
    onSuccess: (_, quizId) => {
      setDeleteDialog({ isOpen: false, quizId: '', quizTitle: '' });

      // Wait for fade-out animation to complete, then remove from list
      setTimeout(() => {
        // Invalidate and refetch quizzes to update the list
        queryClient.invalidateQueries({ queryKey: ['quizzes'] });
        setDeletingQuizId(null);
      }, 300); // Match the CSS transition duration

      setToast({
        isOpen: true,
        message: 'Quiz deleted successfully!',
        type: 'success',
      });
    },
    onError: () => {
      setDeleteDialog({ isOpen: false, quizId: '', quizTitle: '' });
      setDeletingQuizId(null); // Reset deleting state on error
      setToast({
        isOpen: true,
        message: 'Failed to delete quiz. Please try again.',
        type: 'error',
      });
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
      console.log('Upload response:', response);
      // axios interceptor returns response.data, so response.data contains the nested data object
      return response.data;
    },
    onSuccess: async (responseData) => {
      console.log('Upload success data:', responseData);
      // After upload, generate quiz
      await generateQuizMutation.mutateAsync({
        fileId: responseData.fileId,
        questionCount: parseInt(questionCount),
        title,
        filename,
      });
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      // Check if it's upload limit exceeded (429)
      if (error.statusCode === 429) {
        setUploadLimitDialog(true);
      } else {
        setToast({
          isOpen: true,
          message: error.message || 'Failed to upload file. Please try again.',
          type: 'error',
        });
      }
    },
  });

  // Open delete confirmation dialog
  const openDeleteDialog = (quizId: string, quizTitle: string) => {
    setDeleteDialog({
      isOpen: true,
      quizId,
      quizTitle,
    });
  };

  // Open existing quiz in preview dialog
  const openQuizPreview = async (quizId: string) => {
    setIsLoadingQuiz(true);
    try {
      // Fetch full quiz details
      const response = await api.get(`/quiz/${quizId}`);
      const quiz = response.data;

      if (!quiz) {
        setToast({
          isOpen: true,
          message: 'Failed to load quiz details',
          type: 'error',
        });
        return;
      }

      // Ensure questions is an array
      let questions = [];
      if (quiz.questions) {
        if (Array.isArray(quiz.questions)) {
          questions = quiz.questions;
        } else if (typeof quiz.questions === 'string') {
          // Handle case where questions might be a JSON string
          questions = JSON.parse(quiz.questions);
        } else {
          questions = [];
        }
      }

      if (questions.length === 0) {
        setToast({
          isOpen: true,
          message: 'This quiz has no questions',
          type: 'error',
        });
        return;
      }

      // Extract filename from qtiFilePath or generate from title
      let extractedFilename = '';
      if (quiz.qtiFilePath) {
        // Extract filename from path like "uploads/qti/my_quiz.zip"
        const pathParts = quiz.qtiFilePath.split('/');
        const zipFilename = pathParts[pathParts.length - 1];
        extractedFilename = zipFilename.replace('.zip', '');
      } else {
        // Fallback to generating from title
        extractedFilename = quiz.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      }

      // Verify fileUploadId exists (needed for regenerate)
      if (!quiz.fileUploadId) {
        console.warn('Quiz missing fileUploadId, regenerate may not work');
      }

      // Open preview dialog with quiz data
      setPreviewDialog({
        isOpen: true,
        questions: questions,
        quizId: quiz.id,
        fileUploadId: quiz.fileUploadId || '',
        title: quiz.title,
        filename: extractedFilename,
        originalFilename: extractedFilename,
        questionCount: quiz.questionCount || questions.length,
      });
      setEditedQuestions(JSON.parse(JSON.stringify(questions))); // Deep copy
      setEditingQuestion(null);
      setIsReplacingQuestion(null);
    } catch (error: any) {
      setToast({
        isOpen: true,
        message: error.message || 'Failed to load quiz. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  // Confirm deletion
  const confirmDeleteQuiz = async () => {
    await deleteQuizMutation.mutateAsync(deleteDialog.quizId);
  };

  // Generate quiz mutation
  const generateQuizMutation = useMutation({
    mutationFn: async (params: {
      fileId: string;
      questionCount: number;
      title?: string;
      filename?: string;
    }) => {
      const response = await api.post('/quiz', params);
      return response.data;
    },
    onSuccess: (data) => {
      // Show preview dialog with generated questions
      const questions = data.quiz?.questions || [];
      // Generate default filename from title if not provided
      const defaultFilename = filename || title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'quiz';
      setPreviewDialog({
        isOpen: true,
        questions: questions,
        quizId: data.quiz?.id || '',
        fileUploadId: data.quiz?.fileUploadId || '',
        title: data.quiz?.title || title,
        filename: defaultFilename,
        originalFilename: defaultFilename, // Store original filename
        questionCount: parseInt(questionCount),
      });
      setEditedQuestions(JSON.parse(JSON.stringify(questions))); // Deep copy
      setEditingQuestion(null);
      setIsReplacingQuestion(null);
    },
    onError: (error: any) => {
      setToast({
        isOpen: true,
        message: error.message || 'Failed to generate quiz. Please try again.',
        type: 'error',
      });
    },
  });

  // Check for duplicate questions
  const checkForDuplicates = (questions: any[]): boolean => {
    const questionTexts = questions.map(q => q.question.toLowerCase().trim());
    const uniqueTexts = new Set(questionTexts);
    return questionTexts.length !== uniqueTexts.size;
  };

  // Accept quiz and finish (update quiz if edited)
  const handleAcceptQuiz = async () => {
    // Check for duplicates
    if (checkForDuplicates(editedQuestions)) {
      setToast({
        isOpen: true,
        message: 'Duplicate questions detected! Please remove or edit duplicate questions.',
        type: 'error',
      });
      return;
    }

    try {
      // Check if questions or filename were changed
      const originalQuestionsStr = JSON.stringify(previewDialog.questions);
      const editedQuestionsStr = JSON.stringify(editedQuestions);
      const questionsChanged = originalQuestionsStr !== editedQuestionsStr;
      const filenameChanged = previewDialog.filename !== previewDialog.originalFilename;

      // Update quiz if questions or filename changed
      if (questionsChanged || filenameChanged) {
        await api.patch(`/quiz/${previewDialog.quizId}`, {
          questions: editedQuestions,
          filename: previewDialog.filename,
        });
      }

      setPreviewDialog({
        isOpen: false,
        questions: [],
        quizId: '',
        fileUploadId: '',
        title: '',
        filename: '',
        originalFilename: '',
        questionCount: 0,
      });
      setEditedQuestions([]);
      setEditingQuestion(null);
      setSelectedFile(null);
      setTitle('');
      setFilename('');
      refetch();
      setToast({
        isOpen: true,
        message: 'Quiz saved successfully! 🎉',
        type: 'success',
      });
    } catch (error: any) {
      setToast({
        isOpen: true,
        message: error.message || 'Failed to save quiz. Please try again.',
        type: 'error',
      });
    }
  };

  // Regenerate quiz with different questions
  const handleRegenerateQuiz = async () => {
    try {
      // Delete the current quiz first
      await api.delete(`/quiz/${previewDialog.quizId}`);

      // Generate new quiz with the same file, preserving the current filename
      await generateQuizMutation.mutateAsync({
        fileId: previewDialog.fileUploadId,
        questionCount: previewDialog.questionCount,
        title: previewDialog.title,
        filename: previewDialog.filename, // Preserve the current filename
      });
    } catch (error: any) {
      setToast({
        isOpen: true,
        message: error.message || 'Failed to regenerate quiz. Please try again.',
        type: 'error',
      });
    }
  };

  // Replace a single question
  const handleReplaceQuestion = async (index: number) => {
    setIsReplacingQuestion(index);
    try {
      // Generate one new question
      const response = await api.post('/quiz/generate-question', {
        fileUploadId: previewDialog.fileUploadId,
        existingQuestions: editedQuestions.map(q => q.question),
      });

      const newQuestion = response.data.question;

      // Replace the question at the index
      const updatedQuestions = [...editedQuestions];
      updatedQuestions[index] = newQuestion;
      setEditedQuestions(updatedQuestions);

      setToast({
        isOpen: true,
        message: 'Question replaced successfully!',
        type: 'success',
      });
    } catch (error: any) {
      setToast({
        isOpen: true,
        message: error.message || 'Failed to replace question. Please try again.',
        type: 'error',
      });
    } finally {
      setIsReplacingQuestion(null);
    }
  };

  // Start editing a question
  const handleEditQuestion = (index: number) => {
    setEditingQuestion(index);
  };

  // Save edited question
  const handleSaveQuestion = (index: number) => {
    setEditingQuestion(null);
    setToast({
      isOpen: true,
      message: 'Question updated!',
      type: 'success',
    });
  };

  // Cancel editing
  const handleCancelEdit = (index: number) => {
    // Restore original question
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[index] = previewDialog.questions[index];
    setEditedQuestions(updatedQuestions);
    setEditingQuestion(null);
  };

  // Update question field
  const handleUpdateQuestion = (index: number, field: string, value: string) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    };
    setEditedQuestions(updatedQuestions);
  };

  // Update option
  const handleUpdateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...editedQuestions];
    const newOptions = [...updatedQuestions[questionIndex].options];
    newOptions[optionIndex] = value;
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: newOptions,
    };
    setEditedQuestions(updatedQuestions);
  };

  // Set correct answer
  const handleSetCorrectAnswer = (questionIndex: number, answer: string) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      correctAnswer: answer,
    };
    setEditedQuestions(updatedQuestions);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      const file = e.target.files[0];
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      if (!title) {
        setTitle(fileNameWithoutExt);
      }
      if (!filename) {
        // Generate safe filename
        const safeFilename = fileNameWithoutExt.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        setFilename(safeFilename);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      await uploadMutation.mutateAsync(selectedFile);
    } catch (error: any) {
      // Error is already handled by the mutation's onError handler
      console.error('Upload error:', error);
    }
  };

  // Test plan change handlers
  const handleTestUpgrade = async () => {
    setIsChangingPlan(true);
    try {
      await api.post('/subscription/upgrade-test');
      setCurrentPlan('PRO');
      setToast({
        isOpen: true,
        message: '🎉 Upgraded to Pro! You can now test Pro features.',
        type: 'success',
      });
      // Reload to update all Pro features
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setToast({
        isOpen: true,
        message: error.message || 'Failed to upgrade',
        type: 'error',
      });
    } finally {
      setIsChangingPlan(false);
    }
  };

  const handleTestDowngrade = async () => {
    setIsChangingPlan(true);
    try {
      await api.post('/subscription/downgrade-test');
      setCurrentPlan('FREE');
      setToast({
        isOpen: true,
        message: 'Downgraded to Free plan for testing.',
        type: 'success',
      });
      // Reload to update all features
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setToast({
        isOpen: true,
        message: error.message || 'Failed to downgrade',
        type: 'error',
      });
    } finally {
      setIsChangingPlan(false);
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

        {/* TEST CONTROLS - Remove before production */}
        <Card className="mb-8 border-2 border-yellow-300 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  🧪 Test Controls
                  <span className="text-sm font-normal text-yellow-800">(Development Only)</span>
                </CardTitle>
                <p className="text-sm text-yellow-700 mt-1">
                  Test Pro features without payment. Remove before production!
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full font-bold ${
                currentPlan === 'PRO'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-300 text-gray-700'
              }`}>
                {currentPlan === 'PRO' ? '✨ PRO' : 'FREE'}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                onClick={handleTestUpgrade}
                disabled={currentPlan === 'PRO' || isChangingPlan}
                variant={currentPlan === 'FREE' ? 'primary' : 'outline'}
              >
                {isChangingPlan ? 'Processing...' : '⬆️ Upgrade to Pro (Test)'}
              </Button>
              <Button
                onClick={handleTestDowngrade}
                disabled={currentPlan === 'PRO' || isChangingPlan}
                variant={currentPlan === 'PRO' ? 'outline' : 'outline'}
              >
                {isChangingPlan ? 'Processing...' : '⬇️ Downgrade to Free (Test)'}
              </Button>
            </div>
            <div className="mt-4 p-4 bg-white rounded-lg border border-yellow-200">
              <p className="text-sm text-gray-700 mb-2"><strong>Current Features:</strong></p>
              <ul className="text-sm text-gray-600 space-y-1">
                {currentPlan === 'PRO' ? (
                  <>
                    <li>✅ Unlimited uploads</li>
                    <li>✅ Up to 30 questions per quiz</li>

                  </>
                ) : (
                  <>
                    <li>• 5 uploads per month</li>
                    <li>• 5 questions per quiz</li>
                    <li>• Includes watermark</li>
                  </>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>

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
                        label="Filename (for Canvas import)"
                        value={filename}
                        onChange={(e) => {
                          // Sanitize filename - only allow alphanumeric, underscore, hyphen
                          const sanitized = e.target.value.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
                          setFilename(sanitized);
                        }}
                        placeholder="my_quiz_file"
                        helperText="This will be the name of the downloaded .zip file"
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
                    Loading quizzes...
                  </p>
                ) : isError ? (
                  <div className="text-center text-red-600 py-8">
                    <p className="font-semibold">Failed to load quizzes</p>
                    <button
                      onClick={() => refetch()}
                      className="mt-2 text-primary-600 hover:text-primary-700 underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : !quizzes || quizzes.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No quizzes yet. Upload a file to get started!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {quizzes.map((quiz: any) => (
                      <div
                        key={quiz.id}
                        className={`border rounded-lg p-4 hover:shadow-md hover:border-primary-300 transition-all duration-300 bg-white ${
                          isLoadingQuiz ? 'cursor-wait opacity-50' : 'cursor-pointer'
                        } ${
                          deletingQuizId === quiz.id
                            ? 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                            : 'opacity-100 scale-100 translate-y-0'
                        }`}
                        onClick={() => !isLoadingQuiz && !deletingQuizId && openQuizPreview(quiz.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg text-primary-600 hover:text-primary-700">
                                {quiz.title}
                              </h3>
                              <span className="text-xs text-primary-500 bg-primary-50 px-2 py-1 rounded">
                                {isLoadingQuiz ? 'Loading...' : 'Click to edit'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {quiz.questionCount} questions •{' '}
                              {new Date(quiz.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <a
                              href={quiz.qtiFileUrl}
                              download
                              className="btn btn-primary btn-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Download
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog(quiz.id, quiz.title);
                              }}
                              disabled={deleteQuizMutation.isPending}
                              className="btn btn-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md font-medium transition-colors"
                              title="Delete quiz"
                            >
                              Delete
                            </button>
                          </div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, quizId: '', quizTitle: '' })}
        title="Delete Quiz"
        onConfirm={confirmDeleteQuiz}
        confirmText={deleteQuizMutation.isPending ? 'Deleting...' : 'Delete'}
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      >
        <p>
          Are you sure you want to delete <strong>"{deleteDialog.quizTitle}"</strong>?
        </p>
        <p className="mt-2 text-sm text-red-600">
          This action cannot be undone. The quiz and its QTI file will be permanently removed.
        </p>
      </Dialog>

      {/* Upload Limit Exceeded Dialog */}
      <Dialog
        isOpen={uploadLimitDialog}
        onClose={() => setUploadLimitDialog(false)}
        title="Upload Limit Reached"
        onConfirm={() => {
          setUploadLimitDialog(false);
          router.push('/upgrade');
        }}
        confirmText="Upgrade to Pro"
        cancelText="Close"
        confirmButtonClass="bg-primary-600 hover:bg-primary-700"
      >
        <div className="space-y-3">
          <p className="text-gray-700">
            You've reached your upload limit for the <strong>Free plan</strong>.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Free Plan:</strong> 5 uploads per month
            </p>
          </div>
          <p className="text-gray-700">
            Upgrade to <strong>Pro</strong> for unlimited uploads and more features!
          </p>
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <p className="text-sm text-primary-800 font-semibold">
              ✨ Pro Plan Benefits:
            </p>
            <ul className="text-sm text-primary-700 mt-2 space-y-1 ml-4 list-disc">
              <li>Unlimited uploads</li>
              <li>Up to 30 questions per quiz</li>

              <li>Priority support</li>
            </ul>
          </div>
        </div>
      </Dialog>

      {/* Question Preview Dialog */}
      {previewDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Review Generated Questions</h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {previewDialog.title} • {editedQuestions.length} questions
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPreviewDialog({
                      ...previewDialog,
                      isOpen: false,
                      originalFilename: ''
                    });
                    setEditingQuestion(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Filename input */}
              <div className="max-w-xl">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filename for Canvas Import
                </label>
                <input
                  type="text"
                  value={previewDialog.filename}
                  onChange={(e) => {
                    // Sanitize filename - only allow alphanumeric, underscore, hyphen
                    const sanitized = e.target.value.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
                    setPreviewDialog({ ...previewDialog, filename: sanitized });
                  }}
                  placeholder="my_quiz_file"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be the name of your downloaded .zip file (e.g., {previewDialog.filename || 'quiz'}.zip)
                </p>
              </div>
            </div>

            {/* Duplicate Warning */}
            {checkForDuplicates(editedQuestions) && (
              <div className="bg-red-50 border-b border-red-200 p-3 sm:p-4">
                <div className="flex gap-2">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-red-800">Duplicate Questions Detected!</p>
                    <p className="text-xs sm:text-sm text-red-700 mt-1">Please edit or replace duplicate questions before saving.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                {editedQuestions.map((q: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Question Header with Actions */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            {editingQuestion === index ? (
                              <textarea
                                value={q.question}
                                onChange={(e) => handleUpdateQuestion(index, 'question', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                rows={3}
                              />
                            ) : (
                              <p className="font-semibold text-gray-900 text-sm sm:text-base break-words">{q.question}</p>
                            )}
                          </div>
                          {editingQuestion !== index && (
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleEditQuestion(index)}
                                className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit question"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleReplaceQuestion(index)}
                                disabled={isReplacingQuestion === index}
                                className="p-1.5 sm:p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Replace with new question"
                              >
                                {isReplacingQuestion === index ? (
                                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          {q.options.map((option: string, optIndex: number) => (
                            <div key={optIndex}>
                              {editingQuestion === index ? (
                                <div className="flex gap-2">
                                  <input
                                    type="radio"
                                    name={`correct-${index}`}
                                    checked={option === q.correctAnswer}
                                    onChange={() => handleSetCorrectAnswer(index, option)}
                                    className="mt-1 flex-shrink-0"
                                  />
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleUpdateOption(index, optIndex, e.target.value)}
                                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                  />
                                </div>
                              ) : (
                                <div
                                  className={`p-2 sm:p-3 rounded-lg border ${
                                    option === q.correctAnswer
                                      ? 'bg-green-50 border-green-300 text-green-900'
                                      : 'bg-white border-gray-200 text-gray-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {option === q.correctAnswer && (
                                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                    <span className={`text-sm sm:text-base break-words ${option === q.correctAnswer ? 'font-semibold' : ''}`}>
                                      {option}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Edit Actions */}
                        {editingQuestion === index && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                            <Button
                              variant="outline"
                              onClick={() => handleCancelEdit(index)}
                              className="flex-1 text-sm"
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="primary"
                              onClick={() => handleSaveQuestion(index)}
                              className="flex-1 text-sm"
                            >
                              Save Changes
                            </Button>
                          </div>
                        )}

                        {/* Explanation */}
                        {q.explanation && editingQuestion !== index && (
                          <div className="mt-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs sm:text-sm text-blue-900">
                              <strong>Explanation:</strong> {q.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-3 sm:p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col gap-3">
                <div className="text-xs sm:text-sm text-gray-600">
                  <strong>Instructions:</strong> Edit questions inline, replace individual questions, or regenerate all. Check for duplicates before saving.
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    onClick={handleRegenerateQuiz}
                    disabled={generateQuizMutation.isPending || editingQuestion !== null}
                    className="w-full sm:w-auto text-sm"
                  >
                    {generateQuizMutation.isPending ? '🔄 Regenerating...' : '🔄 Regenerate All'}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleAcceptQuiz}
                    disabled={editingQuestion !== null || checkForDuplicates(editedQuestions)}
                    className="w-full sm:w-auto text-sm"
                  >
                    ✓ Accept & Save Quiz
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        message={toast.message}
        type={toast.type}
      />
    </div>
  );
}

