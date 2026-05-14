/**
 * OpenAI — quiz question generation from lecture text.
 */

import OpenAI from 'openai';
import type { QuizQuestion } from '@quizflow/types';
import { env } from '@/config/env.js';
import { AppError } from '@/middleware/errorHandler.js';
import { logger } from '@/config/logger.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

/** Rough cap so prompts stay within model context (adjust if needed). */
const MAX_SOURCE_CHARS = 48_000;

const SYSTEM_PROMPT = `You are an expert educator. Given lecture or reading material, produce multiple-choice quiz questions.
Each question must have:
- "question": clear stem (one sentence preferred)
- "options": exactly 4 distinct strings (A–D style content, no "A)" prefixes required)
- "correctAnswer": must exactly match one of the four strings in "options"
- "explanation": one short sentence why the correct answer is right

Return ONLY valid JSON: {"questions":[...]} with no markdown or prose outside the JSON.`;

/**
 * Generate multiple-choice questions from extracted document text.
 */
export async function generateQuizQuestions(
  sourceText: string,
  questionCount: number,
  materialTitle: string
): Promise<QuizQuestion[]> {
  const trimmed =
    sourceText.length > MAX_SOURCE_CHARS
      ? sourceText.slice(0, MAX_SOURCE_CHARS) +
        '\n\n[...truncated for length...]'
      : sourceText;

  const userPrompt = `Material title: ${materialTitle}
Number of questions: ${questionCount}

Source material:
---
${trimmed}
---

Respond with JSON: {"questions":[{"question":"...","options":["","","",""],"correctAnswer":"...","explanation":"..."}]}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new AppError(502, 'Empty response from AI provider');
    }

    const parsed = JSON.parse(raw) as { questions?: unknown };
    if (!Array.isArray(parsed.questions)) {
      throw new AppError(502, 'Invalid AI response shape');
    }

    const questions = normalizeQuestions(parsed.questions, questionCount);
    if (questions.length === 0) {
      throw new AppError(502, 'AI returned no usable questions');
    }

    return questions;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('OpenAI quiz generation failed', error);
    throw new AppError(502, 'Failed to generate quiz questions');
  }
}

function normalizeQuestions(raw: unknown[], desired: number): QuizQuestion[] {
  const out: QuizQuestion[] = [];

  for (const item of raw) {
    if (out.length >= desired) break;
    if (!item || typeof item !== 'object') continue;

    const q = item as Record<string, unknown>;
    const question = typeof q.question === 'string' ? q.question.trim() : '';
    const options = Array.isArray(q.options)
      ? q.options.filter((o): o is string => typeof o === 'string').map((s) => s.trim())
      : [];
    const correctAnswer =
      typeof q.correctAnswer === 'string' ? q.correctAnswer.trim() : '';
    const explanation =
      typeof q.explanation === 'string' ? q.explanation.trim() : undefined;

    if (!question || options.length !== 4 || !correctAnswer) continue;
    if (!options.includes(correctAnswer)) continue;

    out.push({
      question,
      options,
      correctAnswer,
      ...(explanation ? { explanation } : {}),
    });
  }

  return out;
}
