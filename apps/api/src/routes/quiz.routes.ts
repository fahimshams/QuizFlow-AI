/**
 * Quiz Routes
 */

import { Router } from 'express';
import * as quizController from '@/controllers/quiz.controller.js';
import { authenticate } from '@/middleware/auth.js';
import { validate, commonSchemas } from '@/middleware/validation.js';
import { z } from 'zod';

const router: Router = Router();

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

const quizQuestionSchema = z
  .object({
    question: z.string().min(1, 'Question text is required'),
    options: z.array(z.string().min(1)).min(2, 'At least two options'),
    correctAnswer: z.string().min(1),
    explanation: z.string().optional(),
  })
  .superRefine((row, ctx) => {
    if (!row.options.includes(row.correctAnswer)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'correctAnswer must match one of the options',
        path: ['correctAnswer'],
      });
    }
  });

const updateQuizSchema = {
  params: commonSchemas.id,
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    questions: z.array(quizQuestionSchema).min(1),
  }),
};

const regenerateQuizSchema = {
  params: commonSchemas.id,
  body: z.object({
    questionCount: z.number().int().min(1).max(30).optional(),
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

router.post(
  '/:id/regenerate',
  validate(regenerateQuizSchema),
  quizController.regenerateQuiz
);

router.patch(
  '/:id',
  validate(updateQuizSchema),
  quizController.updateQuiz
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

