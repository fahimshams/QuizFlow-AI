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
  // Validate question count limits
  if (questionCount < 1) {
    throw new AppError(400, 'Question count must be at least 1');
  }

  if (questionCount > 30) {
    throw new AppError(400, 'Question count cannot exceed 30 for optimal quality and performance');
  }

  try {
    logger.info('Generating quiz questions with OpenAI', {
      textLength: extractedText.length,
      questionCount,
      title,
    });

    // Prepare the prompt for OpenAI
    // Increased from 4000 to 16000 chars to provide more content for generating more questions
    const prompt = `You are an expert quiz creator. Generate ${questionCount} multiple-choice questions based on the following content.

Title: ${title}

Content:
${extractedText.substring(0, 16000)} ${extractedText.length > 16000 ? '...(content truncated)' : ''}

CRITICAL REQUIREMENTS:
1. You MUST generate EXACTLY ${questionCount} questions - no more, no less
2. Each question MUST have exactly 4 options (A, B, C, D)
3. Include the correct answer
4. Add a brief explanation for the correct answer
5. Questions should test comprehension and key concepts
6. Ensure variety in question difficulty and topics covered
7. DO NOT stop generating until you have created all ${questionCount} questions

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
}

Remember: Generate EXACTLY ${questionCount} questions!`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using more cost-effective model
      messages: [
        {
          role: 'system',
          content:
            'You are an expert educator who creates high-quality quiz questions. Always respond with valid JSON only. You MUST generate the exact number of questions requested - never generate fewer.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8, // Slightly higher for more diverse questions
      max_tokens: 6000, // Increased to support up to 30+ questions with explanations
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

    // If we didn't get enough questions, generate more to fill the gap
    let finalQuestions = validatedQuestions;

    if (validatedQuestions.length < questionCount) {
      const shortfall = questionCount - validatedQuestions.length;

      logger.warn('AI generated fewer questions than requested, generating additional questions', {
        requested: questionCount,
        generated: validatedQuestions.length,
        shortfall,
        tokensUsed: completion.usage?.total_tokens,
      });

      // Generate additional questions to fill the gap
      const existingQuestions = validatedQuestions.map(q => q.question);
      const additionalQuestions: QuizQuestion[] = [];

      for (let i = 0; i < shortfall; i++) {
        try {
          const newQuestion = await generateSingleQuestion(
            extractedText.substring(0, 16000),
            [...existingQuestions, ...additionalQuestions.map(q => q.question)]
          );
          additionalQuestions.push(newQuestion);
          logger.info(`Generated additional question ${i + 1}/${shortfall}`);
        } catch (error) {
          logger.error(`Failed to generate additional question ${i + 1}`, error);
          // Continue trying to generate remaining questions
        }
      }

      finalQuestions = [...validatedQuestions, ...additionalQuestions];

      // Final check - if we still don't have enough after retries
      if (finalQuestions.length < questionCount) {
        throw new AppError(
          500,
          `Could only generate ${finalQuestions.length} out of ${questionCount} questions. Document may be too short or lacks sufficient content.`
        );
      }
    }

    // Ensure we don't exceed the requested count (trim if needed)
    if (finalQuestions.length > questionCount) {
      finalQuestions = finalQuestions.slice(0, questionCount);
    }

    logger.info('Quiz questions generated successfully', {
      questionsGenerated: finalQuestions.length,
      tokensUsed: completion.usage?.total_tokens,
    });

    return finalQuestions;
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
 * Generate a single question (for replacement, ensuring uniqueness)
 */
export const generateSingleQuestion = async (
  text: string,
  existingQuestions: string[]
): Promise<QuizQuestion> => {
  const existingQuestionsText = existingQuestions.length > 0
    ? `\n\nIMPORTANT: Do NOT generate any of these existing questions:\n${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  const prompt = `Based on the following content, generate ONE multiple-choice question with 4 options.
${existingQuestionsText}

Content:
${text.substring(0, 8000)}

Generate exactly ONE question in this JSON format:
{
  "question": "your question here",
  "options": ["option1", "option2", "option3", "option4"],
  "correctAnswer": "the correct option text",
  "explanation": "brief explanation (optional)"
}

Requirements:
- Generate a NEW question that is DIFFERENT from any existing questions listed above
- Make it relevant to the content
- Provide 4 distinct options
- One option must be clearly correct
- Include the correct answer
- The correctAnswer must match one of the options exactly`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a quiz generator that creates unique, relevant questions in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 1.0, // Higher temperature for more variety
      max_tokens: 800, // Increased for complete question generation
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response (response_format: json_object ensures valid JSON)
    const question = JSON.parse(content);

    // Validate the question structure
    if (
      !question.question ||
      !Array.isArray(question.options) ||
      question.options.length !== 4 ||
      !question.correctAnswer
    ) {
      throw new Error('Invalid question format');
    }

    logger.info('Single question generated successfully');

    return question as QuizQuestion;
  } catch (error) {
    logger.error('Failed to generate single question', error);
    throw new AppError(500, 'Failed to generate question');
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

