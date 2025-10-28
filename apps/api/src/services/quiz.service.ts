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
import { PLAN_LIMITS } from '@quizflow/types';

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

  // Determine question count based on plan
  const planLimits = PLAN_LIMITS[user.plan];
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
  const qtiFileUrl = `${env.API_URL}/${qtiFilePath}`;

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
  await fileService.recordUsage(userId, 'QUIZ_GENERATION');
  await fileService.recordUsage(userId, 'QTI_EXPORT');

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
 * Delete quiz
 */
export const deleteQuiz = async (quizId: string, userId: string) => {
  const quiz = await getQuizById(quizId, userId);

  // Delete QTI file
  try {
    const fs = await import('fs/promises');
    await fs.unlink(quiz.qtiFilePath);
  } catch (error) {
    logger.error('Error deleting QTI file', error);
  }

  // Delete quiz record
  await prisma.quiz.delete({
    where: { id: quizId },
  });
};

