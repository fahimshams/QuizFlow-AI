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
import { PLAN_LIMITS_BY_NAME } from '@/config/constants.js';
import * as openaiService from './openai.service.js';
import * as qtiService from './qti.service.js';
import * as fileService from './file.service.js';

interface GenerateQuizOptions {
  userId: string;
  fileId: string;
  questionCount?: number;
  title?: string;
  filename?: string;
}

/**
 * Generate complete quiz from file
 */
export const generateQuiz = async (options: GenerateQuizOptions) => {
  const { userId, fileId, questionCount, title, filename } = options;

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
  const planLimits = PLAN_LIMITS_BY_NAME[user.plan as 'FREE' | 'PRO'];
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

  // Generate safe filename
  const quizTitle = title || fileUpload.originalName;
  const safeFilename = filename || quizTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  // Generate QTI package
  const qtiFilePath = await qtiService.generateQTIPackage({
    title: quizTitle,
    questions,
    hasWatermark: planLimits.hasWatermark,
    filename: safeFilename,
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
    if (quiz.qtiFilePath) {
      const fs = await import('fs/promises');
      await fs.unlink(quiz.qtiFilePath);
    }
  } catch (error) {
    logger.error('Error deleting QTI file', error);
  }

  // Delete quiz record
  await prisma.quiz.delete({
    where: { id: quizId },
  });
};

/**
 * Update quiz questions and regenerate QTI
 */
export const updateQuizQuestions = async (
  quizId: string,
  userId: string,
  questions: any[],
  filename?: string
) => {
  const quiz = await getQuizById(quizId, userId);

  // Get user for watermark info
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const planLimits = PLAN_LIMITS_BY_NAME[user.plan as 'FREE' | 'PRO'];

  // Delete old QTI file
  try {
    if (quiz.qtiFilePath) {
      const fs = await import('fs/promises');
      await fs.unlink(quiz.qtiFilePath);
    }
  } catch (error) {
    logger.error('Error deleting old QTI file', error);
  }

  // Generate new QTI package with updated questions
  const qtiFilePath = await qtiService.generateQTIPackage({
    title: quiz.title,
    questions,
    hasWatermark: planLimits.hasWatermark,
    filename: filename || quiz.title.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
  });

  const qtiFileUrl = `${env.API_URL}/${qtiFilePath}`;

  // Update quiz in database
  const updatedQuiz = await prisma.quiz.update({
    where: { id: quizId },
    data: {
      questions: questions as any,
      questionCount: questions.length,
      qtiFilePath,
      qtiFileUrl,
    },
  });

  logger.info('Quiz updated successfully', {
    quizId,
    questionsUpdated: questions.length,
  });

  return {
    quiz: updatedQuiz,
    downloadUrl: qtiFileUrl,
  };
};

/**
 * Generate a single question (for replacement)
 */
export const generateSingleQuestion = async (
  fileUploadId: string,
  userId: string,
  existingQuestions: string[]
) => {
  // Get file upload
  const fileUpload = await fileService.getFileUploadById(fileUploadId, userId);

  if (!fileUpload.extractedText) {
    throw new AppError(400, 'File has no extracted text');
  }

  logger.info('Generating single question', {
    userId,
    fileUploadId,
    existingQuestionsCount: existingQuestions.length,
  });

  // Generate one new question that's different from existing ones
  const question = await openaiService.generateSingleQuestion(
    fileUpload.extractedText,
    existingQuestions
  );

  logger.info('Single question generated', {
    userId,
    fileUploadId,
  });

  return question;
};

