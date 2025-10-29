/**
 * OpenAI Service
 *
 * Handles all interactions with OpenAI API for quiz generation
 */

import OpenAI from 'openai';
import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';
import { AppError } from '@/middleware/errorHandler.js';
import type { QuizQuestion, AIQuizResponse } from '@quizflow/types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

/**
 * Generate quiz questions from text content using OpenAI
 */
export const generateQuizQuestions = async (
  extractedText: string,
  questionCount: number,
  title: string
): Promise<QuizQuestion[]> => {
  try {
    logger.info('Generating quiz questions with OpenAI', {
      textLength: extractedText.length,
      questionCount,
      title,
    });

    // Prepare the prompt for OpenAI
    const prompt = `You are an expert quiz creator. Generate ${questionCount} multiple-choice questions based on the following content.

Title: ${title}

Content:
${extractedText.substring(0, 4000)} ${extractedText.length > 4000 ? '...(content truncated)' : ''}

Requirements:
1. Generate exactly ${questionCount} multiple-choice questions
2. Each question should have 4 options (A, B, C, D)
3. Include the correct answer
4. Add a brief explanation for the correct answer
5. Questions should test comprehension and key concepts
6. Ensure variety in question difficulty and topics covered

Return your response as a JSON object in this exact format:
{
  "questions": [
    {
      "question": "What is...?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using more cost-effective model
      messages: [
        {
          role: 'system',
          content:
            'You are an expert educator who creates high-quality quiz questions. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    // Extract and parse the response
    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new AppError(500, 'No response from OpenAI');
    }

    const parsedResponse: AIQuizResponse = JSON.parse(responseText);

    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new AppError(500, 'Invalid response format from OpenAI');
    }

    // Validate each question
    const validatedQuestions: QuizQuestion[] = parsedResponse.questions.map(
      (q, index) => {
        if (!q.question || !q.options || !q.correctAnswer) {
          throw new AppError(
            500,
            `Invalid question format at index ${index}`
          );
        }

        if (q.options.length !== 4) {
          throw new AppError(
            500,
            `Question ${index} must have exactly 4 options`
          );
        }

        return {
          question: q.question.trim(),
          options: q.options.map((opt) => opt.trim()),
          correctAnswer: q.correctAnswer.trim(),
          explanation: q.explanation?.trim(),
        };
      }
    );

    logger.info('Quiz questions generated successfully', {
      questionsGenerated: validatedQuestions.length,
      tokensUsed: completion.usage?.total_tokens,
    });

    return validatedQuestions;
  } catch (error) {
    logger.error('Error generating quiz questions', error);

    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof Error) {
      // Handle OpenAI specific errors
      if ('status' in error && error.status === 429) {
        throw new AppError(
          429,
          'OpenAI rate limit reached. Please try again later.'
        );
      }

      if ('status' in error && error.status === 401) {
        throw new AppError(500, 'OpenAI API authentication failed');
      }

      throw new AppError(
        500,
        `Failed to generate quiz questions: ${error.message}`
      );
    }

    throw new AppError(500, 'Failed to generate quiz questions');
  }
};

/**
 * Test OpenAI connection
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say "Hello"' }],
      max_tokens: 10,
    });

    return !!completion.choices[0]?.message?.content;
  } catch (error) {
    logger.error('OpenAI connection test failed', error);
    return false;
  }
};

