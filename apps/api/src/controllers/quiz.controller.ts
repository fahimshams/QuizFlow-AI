/**
 * Quiz Controller
 */

import { Request, Response } from 'express';
import { asyncHandler, AppError } from '@/middleware/errorHandler.js';
import * as quizService from '@/services/quiz.service.js';
import { logger } from '@/config/logger.js';

/**
 * POST /api/quiz
 * Generate quiz from uploaded file
 */
export const generateQuiz = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'User not authenticated');
  }

  const { fileId, questionCount, title, filename } = req.body;

  logger.info('Quiz generation requested', {
    userId: req.user.id,
    fileId,
    questionCount,
    filename,
  });

  const result = await quizService.generateQuiz({
    userId: req.user.id,
    fileId,
    questionCount,
    title,
    filename,
  });

  logger.info('Quiz generated', {
    userId: req.user.id,
    quizId: result.quiz.id,
  });

  res.status(201).json({
    success: true,
    message: 'Quiz generated successfully',
    data: result,
  });
});

/**
 * GET /api/quiz
 * Get user's quizzes
 */
export const getQuizzes = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'User not authenticated');
  }

  const quizzes = await quizService.getUserQuizzes(req.user.id);

  res.status(200).json({
    success: true,
    data: quizzes,
  });
});

/**
 * GET /api/quiz/:id
 * Get quiz details
 */
export const getQuizById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'User not authenticated');
  }

  const quiz = await quizService.getQuizById(req.params.id, req.user.id);

  res.status(200).json({
    success: true,
    data: quiz,
  });
});

/**
 * DELETE /api/quiz/:id
 * Delete quiz
 */
export const deleteQuiz = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'User not authenticated');
  }

  await quizService.deleteQuiz(req.params.id, req.user.id);

  logger.info('Quiz deleted', {
    userId: req.user.id,
    quizId: req.params.id,
  });

  res.status(200).json({
    success: true,
    message: 'Quiz deleted successfully',
  });
});

/**
 * PATCH /api/quiz/:id
 * Update quiz questions
 */
export const updateQuiz = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'User not authenticated');
  }

  const { questions, filename } = req.body;

  if (!questions || !Array.isArray(questions)) {
    throw new AppError(400, 'Questions array is required');
  }

  const result = await quizService.updateQuizQuestions(
    req.params.id,
    req.user.id,
    questions,
    filename
  );

  logger.info('Quiz updated', {
    userId: req.user.id,
    quizId: req.params.id,
    filename,
  });

  res.status(200).json({
    success: true,
    message: 'Quiz updated successfully',
    data: result,
  });
});

/**
 * POST /api/quiz/generate-question
 * Generate a single question for replacement
 */
export const generateSingleQuestion = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'User not authenticated');
  }

  const { fileUploadId, existingQuestions } = req.body;

  if (!fileUploadId) {
    throw new AppError(400, 'File upload ID is required');
  }

  const question = await quizService.generateSingleQuestion(
    fileUploadId,
    req.user.id,
    existingQuestions || []
  );

  res.status(200).json({
    success: true,
    data: {
      question,
    },
  });
});

