/**
 * Quiz Routes
 */

import { Router } from 'express';
import * as quizController from '@/controllers/quiz.controller.js';
import { authenticate } from '@/middleware/auth.js';
import { validate, commonSchemas } from '@/middleware/validation.js';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const generateQuizSchema = {
  body: z.object({
    fileId: z.string().min(1, 'File ID is required'),
    questionCount: z.number().int().min(1).max(30).optional(),
    title: z.string().min(1).max(200).optional(),
  }),
};

// Routes
router.post(
  '/',
  validate(generateQuizSchema),
  quizController.generateQuiz
);

router.get(
  '/',
  quizController.getQuizzes
);

router.get(
  '/:id',
  validate({ params: commonSchemas.id }),
  quizController.getQuizById
);

router.delete(
  '/:id',
  validate({ params: commonSchemas.id }),
  quizController.deleteQuiz
);

export default router;

