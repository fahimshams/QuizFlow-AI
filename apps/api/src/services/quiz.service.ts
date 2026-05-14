/**
 * Quiz Service
 *
 * Orchestrates the complete quiz generation flow:
 * 1. Get file upload
 * 2. Generate questions with AI
 * 3. Create QTI package
 * 4. Save quiz to database
 */

import { prisma } from '@/config/database.js';
import { AppError } from '@/middleware/errorHandler.js';
import { logger } from '@/config/logger.js';
import { env } from '@/config/env.js';
import * as openaiService from './openai.service.js';
import * as qtiService from './qti.service.js';
import * as fileService from './file.service.js';
import {
  PLAN_LIMITS,
  SubscriptionPlan,
  subscriptionPlanFromDb,
} from '@quizflow/types';
import type { QuizQuestion } from '@quizflow/types';

function qtiPublicUrl(relativePath: string): string {
  const base = env.API_URL.replace(/\/+$/, '');
  const p = relativePath.replace(/^\/+/, '');
  return `${base}/${p}`;
}

interface GenerateQuizOptions {
  userId: string;
  fileId: string;
  questionCount?: number;
  title?: string;
}

/**
 * Generate complete quiz from file
 */
export const generateQuiz = async (options: GenerateQuizOptions) => {
  const { userId, fileId, questionCount, title } = options;

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Get file upload
  const fileUpload = await fileService.getFileUploadById(fileId, userId);

  if (!fileUpload.extractedText) {
    throw new AppError(400, 'File has no extracted text');
  }

  const existingQuiz = await prisma.quiz.findUnique({
    where: { fileUploadId: fileId },
  });
  if (existingQuiz) {
    throw new AppError(
      409,
      'A quiz already exists for this document. Open it from your dashboard to edit or regenerate.'
    );
  }

  const genOk = await fileService.checkQuizGenerationLimit(userId);
  if (!genOk) {
    throw new AppError(
      429,
      'AI quiz generation limit reached for your plan (rolling 7-day window). Upgrade or try again later.'
    );
  }

  // Prisma returns plan as FREE | PRO; PLAN_LIMITS keys are SubscriptionPlan ('free' | 'pro')
  const subscriptionPlan = subscriptionPlanFromDb(String(user.plan));
  const planLimits = PLAN_LIMITS[subscriptionPlan];
  const requestedCount = questionCount || planLimits.questionsPerQuiz;
  const finalCount = Math.min(requestedCount, planLimits.questionsPerQuiz);

  logger.info('Generating quiz', {
    userId,
    fileId,
    plan: user.plan,
    requestedCount: finalCount,
  });

  // Generate questions with AI
  const questions = await openaiService.generateQuizQuestions(
    fileUpload.extractedText,
    finalCount,
    title || fileUpload.originalName
  );

  // Generate QTI package
  const qtiFilePath = await qtiService.generateQTIPackage({
    title: title || fileUpload.originalName,
    questions,
    hasWatermark: planLimits.hasWatermark,
  });

  // Generate download URL
  const qtiFileUrl = qtiPublicUrl(qtiFilePath);

  // Save quiz to database
  const quiz = await prisma.quiz.create({
    data: {
      userId,
      fileUploadId: fileId,
      title: title || fileUpload.originalName,
      questions: questions as any, // Prisma JSON type
      questionCount: questions.length,
      qtiFilePath,
      qtiFileUrl,
      plan: user.plan,
      hasWatermark: planLimits.hasWatermark,
    },
  });

  // Record usage
  await fileService.recordUsage(userId, 'QUIZ_GENERATION', {
    quizId: quiz.id,
    fileId,
    source: 'create',
  });
  await fileService.recordUsage(userId, 'QTI_EXPORT', {
    quizId: quiz.id,
    source: 'create',
  });

  logger.info('Quiz generated successfully', {
    quizId: quiz.id,
    questionsGenerated: questions.length,
  });

  return {
    quiz,
    downloadUrl: qtiFileUrl,
  };
};

/**
 * Get user's quizzes
 */
export const getUserQuizzes = async (userId: string) => {
  return await prisma.quiz.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      fileUpload: {
        select: {
          originalName: true,
          fileType: true,
          fileSize: true,
        },
      },
    },
  });
};

/**
 * Get quiz by ID
 */
export const getQuizById = async (quizId: string, userId: string) => {
  const quiz = await prisma.quiz.findFirst({
    where: {
      id: quizId,
      userId,
    },
    include: {
      fileUpload: {
        select: {
          originalName: true,
          fileType: true,
          fileSize: true,
        },
      },
    },
  });

  if (!quiz) {
    throw new AppError(404, 'Quiz not found');
  }

  return quiz;
};

/**
 * Replace quiz questions (manual edits) and rebuild QTI package.
 */
export const updateQuizQuestions = async (
  quizId: string,
  userId: string,
  questions: QuizQuestion[],
  title?: string
) => {
  const quiz = await getQuizById(quizId, userId);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const subscriptionPlan = subscriptionPlanFromDb(String(user.plan));
  const planLimits = PLAN_LIMITS[subscriptionPlan];
  if (questions.length > planLimits.questionsPerQuiz) {
    throw new AppError(
      400,
      `Your plan allows at most ${planLimits.questionsPerQuiz} questions per quiz`
    );
  }

  if (quiz.qtiFilePath) {
    try {
      const fs = await import('fs/promises');
      await fs.unlink(quiz.qtiFilePath);
    } catch {
      /* ignore missing file */
    }
  }

  const displayTitle = title?.trim() || quiz.title;
  const qtiFilePath = await qtiService.generateQTIPackage({
    title: displayTitle,
    questions,
    hasWatermark: planLimits.hasWatermark,
  });
  const qtiFileUrl = qtiPublicUrl(qtiFilePath);

  const updated = await prisma.quiz.update({
    where: { id: quizId },
    data: {
      title: displayTitle,
      questions: questions as object[],
      questionCount: questions.length,
      qtiFilePath,
      qtiFileUrl,
    },
    include: {
      fileUpload: {
        select: { originalName: true, fileType: true, fileSize: true },
      },
    },
  });

  await fileService.recordUsage(userId, 'QTI_EXPORT', {
    quizId,
    source: 'manual_edit',
  });

  return { quiz: updated, downloadUrl: qtiFileUrl };
};

/**
 * Regenerate questions with AI (counts toward weekly generation limit on Free).
 */
export const regenerateQuizWithAI = async (
  quizId: string,
  userId: string,
  questionCount?: number
) => {
  const genOk = await fileService.checkQuizGenerationLimit(userId);
  if (!genOk) {
    throw new AppError(
      429,
      'AI quiz generation limit reached for your plan (rolling 7-day window). Upgrade or try again later.'
    );
  }

  const quiz = await getQuizById(quizId, userId);
  const fileUpload = await fileService.getFileUploadById(
    quiz.fileUploadId,
    userId
  );
  if (!fileUpload.extractedText) {
    throw new AppError(400, 'Source document text is no longer available');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  const subscriptionPlan = subscriptionPlanFromDb(String(user.plan));
  const planLimits = PLAN_LIMITS[subscriptionPlan];
  const finalCount = Math.min(
    questionCount ?? quiz.questionCount,
    planLimits.questionsPerQuiz
  );

  const questions = await openaiService.generateQuizQuestions(
    fileUpload.extractedText,
    finalCount,
    quiz.title
  );

  if (quiz.qtiFilePath) {
    try {
      const fs = await import('fs/promises');
      await fs.unlink(quiz.qtiFilePath);
    } catch {
      /* ignore */
    }
  }

  const qtiFilePath = await qtiService.generateQTIPackage({
    title: quiz.title,
    questions,
    hasWatermark: planLimits.hasWatermark,
  });
  const qtiFileUrl = qtiPublicUrl(qtiFilePath);

  const updated = await prisma.quiz.update({
    where: { id: quizId },
    data: {
      questions: questions as object[],
      questionCount: questions.length,
      qtiFilePath,
      qtiFileUrl,
    },
    include: {
      fileUpload: {
        select: { originalName: true, fileType: true, fileSize: true },
      },
    },
  });

  await fileService.recordUsage(userId, 'QUIZ_GENERATION', {
    quizId,
    source: 'regenerate',
  });
  await fileService.recordUsage(userId, 'QTI_EXPORT', {
    quizId,
    source: 'regenerate',
  });

  return { quiz: updated, downloadUrl: qtiFileUrl };
};

/**
 * Delete quiz
 */
export const deleteQuiz = async (quizId: string, userId: string) => {
  const quiz = await getQuizById(quizId, userId);

  // Delete QTI file
  if (quiz.qtiFilePath) {
    try {
      const fs = await import('fs/promises');
      await fs.unlink(quiz.qtiFilePath);
    } catch (error) {
      logger.error('Error deleting QTI file', error);
    }
  }

  // Delete quiz record
  await prisma.quiz.delete({
    where: { id: quizId },
  });
};

