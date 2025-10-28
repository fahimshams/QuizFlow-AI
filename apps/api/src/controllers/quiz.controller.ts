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

  const { fileId, questionCount, title } = req.body;

  logger.info('Quiz generation requested', {
    userId: req.user.id,
    fileId,
    questionCount,
  });

  const result = await quizService.generateQuiz({
    userId: req.user.id,
    fileId,
    questionCount,
    title,
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

