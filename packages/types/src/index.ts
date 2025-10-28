/**
 * @quizflow/types
 * Shared TypeScript types across frontend and backend
 *
 * Why shared types?
 * - Type safety between API requests/responses
 * - Single source of truth
 * - Catch breaking changes at compile time
 */

// ============================================
// USER & AUTHENTICATION
// ============================================

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum SubscriptionPlan {
  FREE = 'free',
  PRO = 'pro',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plan: SubscriptionPlan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ============================================
// QUIZ & QUESTIONS
// ============================================

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface Quiz {
  id: string;
  userId: string;
  title: string;
  questions: QuizQuestion[];
  sourceFileName: string;
  qtiFileUrl?: string;
  plan: SubscriptionPlan;
  createdAt: Date;
}

// OpenAI Response Structure
export interface AIQuizResponse {
  questions: QuizQuestion[];
}

// ============================================
// FILE UPLOAD
// ============================================

export enum FileType {
  PDF = 'pdf',
  DOCX = 'docx',
  TXT = 'txt',
}

export interface FileUpload {
  id: string;
  userId: string;
  fileName: string;
  fileType: FileType;
  fileSize: number;
  filePath: string;
  extractedText?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
}

// ============================================
// USAGE TRACKING
// ============================================

export interface UsageRecord {
  id: string;
  userId: string;
  action: 'upload' | 'quiz_generation';
  plan: SubscriptionPlan;
  timestamp: Date;
}

// Plan limits
export const PLAN_LIMITS = {
  [SubscriptionPlan.FREE]: {
    uploadsPerWeek: 1,
    questionsPerQuiz: 5,
    hasWatermark: true,
  },
  [SubscriptionPlan.PRO]: {
    uploadsPerWeek: Infinity,
    questionsPerQuiz: 30,
    hasWatermark: false,
  },
} as const;

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  tokens: AuthTokens;
}

// Quiz Generation
export interface GenerateQuizRequest {
  fileId: string;
  questionCount?: number;
  title?: string;
}

export interface GenerateQuizResponse {
  quiz: Quiz;
  downloadUrl: string;
}

// Subscription
export interface CreateCheckoutSessionRequest {
  plan: SubscriptionPlan;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

// ============================================
// API ERROR RESPONSE
// ============================================

export interface APIError {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

// ============================================
// UTILITY TYPES
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

