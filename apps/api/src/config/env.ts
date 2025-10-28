/**
 * Environment Configuration
 *
 * BEST PRACTICE: Centralize all environment variables
 * - Type-safe access
 * - Validation on startup
 * - Single source of truth
 * - Fails fast if config is missing
 */

import { config } from 'dotenv';
import { z } from 'zod';

// Load .env file
config();

// Define schema for environment variables
// Zod ensures all required vars exist and are valid
const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)),
  API_URL: z.string().url(),
  WEB_URL: z.string().url(),

  // Database
  DATABASE_URL: z.string().min(1),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),

  // OpenAI
  OPENAI_API_KEY: z.string().startsWith('sk-'),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_PRO_PRICE_ID: z.string().startsWith('price_'),

  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).pipe(z.number().positive()),
  UPLOAD_DIR: z.string().default('./uploads'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default('100'),

  // CORS
  CORS_ORIGIN: z.string().url(),
});

// Parse and validate
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;

// Type export for usage throughout the app
export type Env = z.infer<typeof envSchema>;

