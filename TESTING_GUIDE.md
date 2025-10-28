# Testing Guide 🧪

Comprehensive testing strategy for QuizFlow AI.

## 🎯 Testing Philosophy

**Why Test?**
- Catch bugs before production
- Document behavior
- Enable confident refactoring
- Improve code quality
- Faster development (yes, really!)

**Testing Pyramid:**
```
        /\
       /E2E\      Few (expensive, slow)
      /------\
     /  API  \    Some (moderate cost)
    /--------\
   /   Unit   \   Many (cheap, fast)
  /____________\
```

---

## 🛠️ Setup

### Install Testing Dependencies

```bash
# Backend (Vitest + Supertest)
cd apps/api
pnpm add -D vitest @vitest/ui supertest @types/supertest

# Frontend (Vitest + Testing Library)
cd apps/web
pnpm add -D vitest @vitejs/plugin-react
pnpm add -D @testing-library/react @testing-library/jest-dom
pnpm add -D @testing-library/user-event

# E2E (Playwright)
pnpm add -D @playwright/test
npx playwright install
```

### Configure Vitest (Backend)

Create `apps/api/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.test.ts'],
    },
  },
});
```

Create `apps/api/src/__tests__/setup.ts`:

```typescript
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../config/database';

beforeAll(async () => {
  // Setup test database
  await prisma.$connect();
});

afterAll(async () => {
  // Cleanup
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clear database before each test
  await prisma.quiz.deleteMany();
  await prisma.fileUpload.deleteMany();
  await prisma.user.deleteMany();
});
```

---

## 1️⃣ Unit Tests

Test individual functions in isolation.

### Example: Service Tests

Create `apps/api/src/services/__tests__/auth.service.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import * as authService from '../auth.service';
import { prisma } from '../../config/database';

describe('Auth Service', () => {
  describe('registerUser', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User',
      };

      const result = await authService.registerUser(
        userData.email,
        userData.password,
        userData.name
      );

      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Test123!',
        name: 'Test User',
      };

      // Create user first
      await authService.registerUser(
        userData.email,
        userData.password,
        userData.name
      );

      // Try to create again
      await expect(
        authService.registerUser(
          userData.email,
          userData.password,
          userData.name
        )
      ).rejects.toThrow('User already exists');
    });

    it('should hash password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User',
      };

      await authService.registerUser(
        userData.email,
        userData.password,
        userData.name
      );

      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(user?.password).not.toBe(userData.password);
      expect(user?.password).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt format
    });
  });

  describe('loginUser', () => {
    it('should login with valid credentials', async () => {
      // Setup: create user
      const userData = {
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User',
      };

      await authService.registerUser(
        userData.email,
        userData.password,
        userData.name
      );

      // Test: login
      const result = await authService.loginUser(
        userData.email,
        userData.password
      );

      expect(result.user.email).toBe(userData.email);
      expect(result.tokens.accessToken).toBeDefined();
    });

    it('should throw error with invalid credentials', async () => {
      await expect(
        authService.loginUser('nonexistent@example.com', 'WrongPass!')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

### Example: Utility Tests

Create `apps/api/src/services/__tests__/qti.service.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import * as qtiService from '../qti.service';
import fs from 'fs/promises';

describe('QTI Service', () => {
  it('should generate valid QTI package', async () => {
    const questions = [
      {
        question: 'What is 2+2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        explanation: 'Basic math',
      },
    ];

    const zipPath = await qtiService.generateQTIPackage({
      title: 'Test Quiz',
      questions,
      hasWatermark: false,
    });

    // Check file exists
    const stats = await fs.stat(zipPath);
    expect(stats.size).toBeGreaterThan(0);

    // Cleanup
    await fs.unlink(zipPath);
  });

  it('should include watermark when specified', async () => {
    const questions = [
      {
        question: 'Test?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
      },
    ];

    const zipPath = await qtiService.generateQTIPackage({
      title: 'Test Quiz',
      questions,
      hasWatermark: true,
    });

    // Extract and check for watermark comment
    // (implementation depends on unzip library)

    // Cleanup
    await fs.unlink(zipPath);
  });
});
```

---

## 2️⃣ Integration Tests

Test API endpoints with database.

### Example: API Tests

Create `apps/api/src/routes/__tests__/auth.routes.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app';

describe('Auth Routes', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });

  describe('POST /api/auth/register', () => {
    it('should register new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Test123!',
          name: 'New User',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123!',
          name: 'Test',
        });

      expect(response.status).toBe(400);
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          name: 'Test',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login existing user', async () => {
      // Setup: Register user
      await request(app).post('/api/auth/register').send({
        email: 'logintest@example.com',
        password: 'Test123!',
        name: 'Login Test',
      });

      // Test: Login
      const response = await request(app).post('/api/auth/login').send({
        email: 'logintest@example.com',
        password: 'Test123!',
      });

      expect(response.status).toBe(200);
      expect(response.body.data.user.email).toBe('logintest@example.com');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'WrongPass!',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user with valid token', async () => {
      // Setup: Register and login
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'metest@example.com',
          password: 'Test123!',
          name: 'Me Test',
        });

      const token = registerRes.body.data.tokens.accessToken;

      // Test: Get profile
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe('metest@example.com');
    });

    it('should reject without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });
});
```

---

## 3️⃣ E2E Tests

Test complete user flows with Playwright.

### Setup Playwright

Create `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Example: E2E Tests

Create `e2e/quiz-generation.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Quiz Generation Flow', () => {
  test('user can register, upload file, and generate quiz', async ({
    page,
  }) => {
    // 1. Register
    await page.goto('/register');
    await page.fill('[name="name"]', 'E2E Test User');
    await page.fill('[name="email"]', 'e2e@example.com');
    await page.fill('[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // 2. Upload file
    await page.setInputFiles(
      'input[type="file"]',
      './e2e/fixtures/sample.pdf'
    );

    // 3. Set quiz options
    await page.fill('[name="title"]', 'E2E Test Quiz');
    await page.fill('[name="questionCount"]', '5');

    // 4. Generate quiz
    await page.click('button:has-text("Generate Quiz")');

    // 5. Wait for generation
    await expect(
      page.locator('text=Quiz generated successfully')
    ).toBeVisible({
      timeout: 30000, // AI generation takes time
    });

    // 6. Verify quiz appears in list
    await expect(page.locator('text=E2E Test Quiz')).toBeVisible();

    // 7. Download quiz
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/quiz_\d+\.zip/);
  });

  test('free user is limited to 5 questions', async ({ page }) => {
    // Login as free user
    await page.goto('/login');
    await page.fill('[name="email"]', 'free@example.com');
    await page.fill('[name="password"]', 'Free123!');
    await page.click('button[type="submit"]');

    // Try to set 10 questions
    await page.goto('/dashboard');
    await page.fill('[name="questionCount"]', '10');

    // Should be capped at 5
    await page.fill('[name="questionCount"]', '5');
    expect(await page.inputValue('[name="questionCount"]')).toBe('5');
  });
});
```

Create `e2e/payment.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Payment Flow', () => {
  test('user can upgrade to Pro plan', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');

    // 2. Go to pricing
    await page.goto('/pricing');

    // 3. Click upgrade
    await page.click('button:has-text("Upgrade to Pro")');

    // 4. Should redirect to Stripe
    await page.waitForURL(/.*checkout\.stripe\.com.*/);

    // 5. Verify Stripe page loaded
    await expect(page.locator('text=Card information')).toBeVisible();

    // Note: Don't actually complete payment in tests!
    // Use Stripe test mode and mock webhooks
  });
});
```

---

## 🎭 Mocking

### Mock External APIs

Create `apps/api/src/__tests__/mocks.ts`:

```typescript
import { vi } from 'vitest';

// Mock OpenAI
export const mockOpenAI = () => {
  return vi.mock('openai', () => ({
    default: class OpenAI {
      chat = {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    questions: [
                      {
                        question: 'Mock question?',
                        options: ['A', 'B', 'C', 'D'],
                        correctAnswer: 'A',
                      },
                    ],
                  }),
                },
              },
            ],
          }),
        },
      };
    },
  }));
};

// Mock Stripe
export const mockStripe = () => {
  return vi.mock('stripe', () => ({
    default: class Stripe {
      checkout = {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: 'mock_session_id',
            url: 'https://checkout.stripe.com/mock',
          }),
        },
      };
    },
  }));
};
```

---

## 📊 Coverage

### Run Tests with Coverage

```bash
# Backend
cd apps/api
pnpm test -- --coverage

# Frontend
cd apps/web
pnpm test -- --coverage

# View coverage report
open coverage/index.html
```

### Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows

---

## 🚀 Running Tests

### Development

```bash
# Watch mode (reruns on file change)
pnpm test -- --watch

# UI mode (interactive)
pnpm test -- --ui

# Specific file
pnpm test auth.service.test.ts
```

### CI/CD

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Run E2E
pnpm playwright test
```

---

## ✅ Testing Checklist

### Before Committing

- [ ] All tests pass
- [ ] New features have tests
- [ ] Bug fixes have regression tests
- [ ] Coverage maintained/improved
- [ ] No skipped tests (unless documented)

### Before Deploying

- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance tests acceptable
- [ ] Security tests pass

---

## 📚 Best Practices

1. **Write Tests First** (TDD)
   - Define behavior
   - Write failing test
   - Implement feature
   - Test passes!

2. **Test Behavior, Not Implementation**
   ```typescript
   // ❌ BAD: Testing implementation
   expect(service.internalCache).toBeDefined();

   // ✅ GOOD: Testing behavior
   const result = await service.getData();
   expect(result).toEqual(expectedData);
   ```

3. **One Assert Per Test** (when possible)
   - Makes failures clear
   - Tests specific behavior
   - Easier to maintain

4. **Use Descriptive Names**
   ```typescript
   // ❌ BAD
   test('test1', () => {});

   // ✅ GOOD
   test('should return 401 when token is expired', () => {});
   ```

5. **Arrange, Act, Assert**
   ```typescript
   test('example', () => {
     // Arrange: Setup
     const user = { email: 'test@example.com' };

     // Act: Execute
     const result = formatUser(user);

     // Assert: Verify
     expect(result.email).toBe('test@example.com');
   });
   ```

---

## 🎯 What to Test

### Always Test

- ✅ Authentication & authorization
- ✅ Payment processing
- ✅ Data validation
- ✅ Error handling
- ✅ Critical business logic
- ✅ Security features

### Sometimes Test

- ⚠️ Simple CRUD operations
- ⚠️ UI components (focus on behavior)
- ⚠️ Configuration loading

### Don't Test

- ❌ Third-party libraries
- ❌ Framework internals
- ❌ Generated code

---

**Happy Testing! 🧪**

Remember: Tests are documentation that never lies!

