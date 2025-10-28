# QuizFlow AI - Full-Stack Learning Guide 🎓

Welcome! This document explains every major concept, pattern, and decision in this production-grade SaaS application.

## 🏗️ Architecture Overview

### Why Monorepo?

```
quizflow-ai/
├── apps/              # Applications
│   ├── api/          # Backend (Express)
│   └── web/          # Frontend (Next.js)
└── packages/          # Shared code
    └── types/        # TypeScript types
```

**Benefits:**
- **Code Sharing**: Types are shared between frontend & backend
- **Atomic Changes**: Update API and frontend together
- **Single CI/CD**: One pipeline for entire stack
- **DRY Principle**: Don't repeat type definitions

### Tech Stack Decisions

| Technology | Why? |
|------------|------|
| **TypeScript** | Catch bugs at compile-time, not runtime |
| **pnpm** | Faster than npm, efficient disk usage |
| **Prisma** | Type-safe database access, easy migrations |
| **React Query** | Server state management, caching, optimistic updates |
| **Tailwind CSS** | Utility-first, consistent design, fast development |
| **Zod** | Runtime validation + TypeScript types in one |

---

## 🔐 Backend Patterns

### 1. MVC Architecture

```
Request → Router → Controller → Service → Database
```

**Why separate layers?**

```typescript
// ❌ BAD: Everything in one file
router.post('/quiz', async (req, res) => {
  const user = await prisma.user.findUnique(...);
  const text = await extractPDF(file);
  const questions = await openai.create(...);
  // ... 100 more lines
});

// ✅ GOOD: Separation of concerns
router.post('/quiz', authenticate, validate(schema), quizController.generate);
// Controller calls service
// Service contains business logic
// Easy to test, reuse, and maintain
```

**Example Flow:**
1. **Route** (`quiz.routes.ts`): Define endpoints, apply middleware
2. **Controller** (`quiz.controller.ts`): Handle HTTP, validate input
3. **Service** (`quiz.service.ts`): Business logic, no HTTP knowledge
4. **Database** (`prisma`): Data access layer

### 2. Middleware Pattern

```typescript
app.use(middleware1);  // Runs first
app.use(middleware2);  // Runs second
app.use(routes);       // Then routes
app.use(errorHandler); // Catches all errors
```

**Key Middlewares:**
- **helmet**: Security headers (prevent XSS, clickjacking)
- **cors**: Allow frontend to make requests
- **rate limiting**: Prevent abuse (100 requests/15 min)
- **authentication**: Verify JWT tokens
- **validation**: Check request data with Zod
- **error handling**: Centralized error responses

### 3. Error Handling

```typescript
// Custom error class
class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
  }
}

// Throw anywhere in your code
if (!user) {
  throw new AppError(404, 'User not found');
}

// Global error handler catches it
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    error: err.message,
    statusCode: err.statusCode,
  });
});
```

**Benefits:**
- No try-catch blocks everywhere
- Consistent error responses
- Never crashes the server

### 4. Async Handler Pattern

```typescript
// ❌ Without async handler
router.get('/users', async (req, res, next) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    next(error); // Manual error forwarding
  }
});

// ✅ With async handler
router.get('/users', asyncHandler(async (req, res) => {
  const users = await getUsers();
  res.json(users); // Errors automatically caught
}));
```

### 5. Environment Configuration

**Why centralized?**
```typescript
// ❌ BAD: Accessing directly
const apiKey = process.env.OPENAI_API_KEY;
// What if it's undefined? App crashes at runtime!

// ✅ GOOD: Validated on startup
const envSchema = z.object({
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  // App won't start if invalid
});

export const env = envSchema.parse(process.env);
// Now env.OPENAI_API_KEY is guaranteed to exist
```

---

## 🎨 Frontend Patterns

### 1. Next.js App Router

```
app/
├── page.tsx              # / route
├── pricing/
│   └── page.tsx          # /pricing route
└── dashboard/
    └── page.tsx          # /dashboard route
```

**File-based routing:**
- Intuitive: file path = URL path
- Automatic code splitting
- Built-in SEO optimization

### 2. Server vs Client Components

```typescript
// Server Component (default)
// Runs on server, can access DB directly
export default async function Page() {
  const data = await fetchFromDB();
  return <div>{data}</div>;
}

// Client Component (interactive)
'use client';
import { useState } from 'react';

export default function Interactive() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

**When to use which?**
- **Server**: Static content, SEO important, data fetching
- **Client**: User interactions, state, browser APIs

### 3. React Query Pattern

```typescript
// Fetching data
const { data, isLoading, error } = useQuery({
  queryKey: ['quizzes'],
  queryFn: async () => {
    const response = await api.get('/quiz');
    return response.data;
  },
});

// Mutating data
const mutation = useMutation({
  mutationFn: async (data) => api.post('/quiz', data),
  onSuccess: () => {
    queryClient.invalidateQueries(['quizzes']); // Refetch
  },
});
```

**Benefits:**
- Automatic caching
- Loading/error states
- Refetch on window focus
- Optimistic updates
- No Redux boilerplate

### 4. Component Design System

```typescript
// Base component
<Button variant="primary" size="lg" isLoading>
  Submit
</Button>

// Variants defined once
const variants = {
  primary: 'bg-blue-600 text-white',
  secondary: 'bg-gray-200 text-gray-900',
};
```

**Benefits:**
- Consistent UI across app
- TypeScript autocomplete
- Easy to change theme
- Accessibility built-in

---

## 🔒 Security Best Practices

### 1. Authentication Flow

```
1. User logs in
2. Server generates JWT tokens:
   - Access token (short-lived: 15 min)
   - Refresh token (long-lived: 7 days)
3. Client stores tokens in localStorage
4. Every request includes access token
5. When access token expires:
   - Use refresh token to get new access token
6. When refresh expires:
   - User must log in again
```

**Why two tokens?**
- Access token short-lived = less risk if stolen
- Refresh token long-lived = better UX
- Can revoke refresh tokens in database

### 2. Input Validation

```typescript
// Never trust user input!

// 1. Validate at API boundary
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// 2. Sanitize (prevent injection)
import mongoSanitize from 'express-mongo-sanitize';
app.use(mongoSanitize());

// 3. Type-safe throughout app
function createUser(data: RegisterInput) {
  // data is validated and typed
}
```

### 3. Rate Limiting

```typescript
// Prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts',
});

router.post('/login', authLimiter, loginController);
```

### 4. Security Headers

```typescript
// Helmet sets these automatically:
// X-Frame-Options: Prevent clickjacking
// X-Content-Type-Options: Prevent MIME sniffing
// X-XSS-Protection: XSS protection
// Content-Security-Policy: Control resources
```

---

## 💾 Database Patterns

### 1. Prisma ORM

**Why Prisma?**
```typescript
// Type-safe queries
const users = await prisma.user.findMany({
  where: { plan: 'PRO' },
  include: { quizzes: true },
});
// TypeScript knows the shape of users!

// Auto-complete everywhere
users[0]. // IDE shows: id, email, name, quizzes...
```

### 2. Schema Design

```prisma
model User {
  id        String   @id @default(auto())
  email     String   @unique
  quizzes   Quiz[]   // Relation
  createdAt DateTime @default(now())

  @@map("users") // Table name
}
```

**Best Practices:**
- Use relations (foreign keys)
- Add indexes for queries
- Use enums for fixed values
- Soft delete (status field) vs hard delete

### 3. Migrations

```bash
# Create migration
pnpm prisma migrate dev --name add_user_plan

# Push to database (no migration)
pnpm prisma db push

# Generate client (after schema change)
pnpm prisma generate
```

---

## 🤖 AI Integration Patterns

### 1. Prompt Engineering

```typescript
const prompt = `
Generate ${count} quiz questions from this content.

**Requirements:**
1. Questions test understanding
2. Each has 4 options
3. Only ONE correct answer
4. Options are plausible

**Output Format (JSON):**
{
  "questions": [...]
}
`;
```

**Tips:**
- Be specific and clear
- Provide examples
- Request structured output (JSON)
- Set constraints (number, format)

### 2. Error Handling

```typescript
try {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [...],
    response_format: { type: 'json_object' }, // Force JSON
  });

  const data = JSON.parse(response.choices[0].message.content);

  // Validate response
  if (!data.questions || !Array.isArray(data.questions)) {
    throw new Error('Invalid response structure');
  }

} catch (error) {
  // Log for debugging
  logger.error('OpenAI failed', { error });
  // User-friendly message
  throw new AppError(500, 'Quiz generation failed');
}
```

### 3. Cost Optimization

```typescript
// Truncate input to avoid high costs
const maxChars = 20000; // ~5000 tokens
const truncatedText = text.slice(0, maxChars);

// Use cheaper models when possible
model: 'gpt-4o-mini', // vs 'gpt-4'

// Cache results
const cacheKey = `quiz:${fileId}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;
```

---

## 💳 Payment Integration

### Stripe Best Practices

```typescript
// 1. Create checkout session
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  line_items: [{ price: priceId, quantity: 1 }],
  mode: 'subscription',
  success_url: 'https://yourapp.com/success',
  cancel_url: 'https://yourapp.com/cancel',
});

// 2. Redirect user to Stripe
window.location.href = session.url;

// 3. Handle webhooks (async, reliable)
router.post('/webhook',
  express.raw({ type: 'application/json' }), // Important!
  webhookController
);

// 4. Verify webhook signature
const event = stripe.webhooks.constructEvent(
  payload,
  signature,
  webhookSecret
);

// 5. Update database based on events
switch (event.type) {
  case 'checkout.session.completed':
    await upgradeUserToPro(userId);
    break;
  case 'customer.subscription.deleted':
    await downgradeUserToFree(userId);
    break;
}
```

**Why webhooks?**
- Reliable (Stripe retries)
- Async (don't block checkout)
- Handles all scenarios (success, failure, cancellation)

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Test individual functions
describe('generateQuizQuestions', () => {
  it('should generate correct number of questions', async () => {
    const questions = await generateQuizQuestions(text, 5);
    expect(questions).toHaveLength(5);
  });

  it('should validate question format', async () => {
    const questions = await generateQuizQuestions(text, 5);
    questions.forEach(q => {
      expect(q.question).toBeDefined();
      expect(q.options).toHaveLength(4);
      expect(q.options).toContain(q.correctAnswer);
    });
  });
});
```

### Integration Tests

```typescript
// Test API endpoints
describe('POST /api/quiz', () => {
  it('should create quiz from file', async () => {
    const response = await request(app)
      .post('/api/quiz')
      .set('Authorization', `Bearer ${token}`)
      .send({ fileId: 'test-123', questionCount: 5 });

    expect(response.status).toBe(201);
    expect(response.body.data.quiz).toBeDefined();
  });
});
```

### E2E Tests (Playwright)

```typescript
// Test user flows
test('user can generate quiz', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  await page.goto('/dashboard');
  await page.setInputFiles('input[type="file"]', 'test.pdf');
  await page.click('text=Generate Quiz');

  await expect(page.locator('text=Quiz generated')).toBeVisible();
});
```

---

## 🚀 Deployment Patterns

### Environment Management

```
Development  →  Staging  →  Production
(localhost)    (staging)   (production)
```

**Environment variables per stage:**
```bash
# Development
DATABASE_URL=mongodb://localhost:27017/quizflow
NODE_ENV=development

# Production
DATABASE_URL=mongodb+srv://...atlas.mongodb.net/quizflow
NODE_ENV=production
```

### Docker

```dockerfile
# Multi-stage build (smaller image)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/server.js"]
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm run build
      - run: npm run deploy
```

---

## 📊 Monitoring & Logging

### Structured Logging

```typescript
// ❌ console.log('User logged in');

// ✅ Structured logging
logger.info('User logged in', {
  userId: user.id,
  ip: req.ip,
  timestamp: new Date(),
});
```

**Benefits:**
- Searchable (CloudWatch, DataDog)
- Filterable (find all errors)
- Contextual (see related logs)

### Error Tracking

```typescript
// Production: Send to Sentry
if (env.NODE_ENV === 'production') {
  Sentry.captureException(error);
}

// Development: Log to console
logger.error('Error occurred', { error, context });
```

---

## 🎯 Key Takeaways

### Production vs Tutorial Code

| Tutorial Code | Production Code |
|---------------|-----------------|
| `console.log()` | Structured logging |
| No error handling | Try-catch + global handler |
| Hardcoded values | Environment variables |
| Any type | Strict TypeScript |
| No validation | Zod/Joi validation |
| Single file | Layered architecture |
| No tests | Unit + integration tests |
| No auth | JWT + refresh tokens |
| Plain fetch | Axios with interceptors |

### Principles Applied

1. **DRY**: Don't Repeat Yourself
2. **SOLID**: Single responsibility, etc.
3. **Separation of Concerns**: MVC pattern
4. **Fail Fast**: Validate early
5. **Type Safety**: TypeScript everywhere
6. **Security First**: Never trust input
7. **Observability**: Log everything
8. **Scalability**: Stateless services

---

## 📚 Further Learning

### Books
- "Clean Code" by Robert Martin
- "Designing Data-Intensive Applications" by Martin Kleppmann
- "The Pragmatic Programmer" by Hunt & Thomas

### Resources
- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [React Query Docs](https://tanstack.com/query)
- [MDN Web Docs](https://developer.mozilla.org)

### Practice Projects
1. Add user avatars with file uploads
2. Implement email verification
3. Add quiz analytics dashboard
4. Build admin panel
5. Add real-time collaboration

---

## 🤔 Common Questions

**Q: Why not use Next.js API routes for backend?**
A: Separation allows independent scaling and deployment. Express has richer middleware ecosystem.

**Q: Why MongoDB over PostgreSQL?**
A: Both are fine! MongoDB is flexible for rapid prototyping. Use Postgres if you need complex queries.

**Q: Why not use Redux?**
A: React Query handles server state better. Local state with useState is sufficient for most cases.

**Q: Should I use this exact structure?**
A: Adapt to your needs! But understand WHY each pattern exists before changing.

---

**Keep Learning! 🚀**

Every line of code in this project is commented to explain the "why", not just the "what".
Read the code, modify it, break it, fix it. That's how you learn!

