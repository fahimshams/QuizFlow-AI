# QuizFlow AI - Quick Start Guide ⚡

Get up and running in 5 minutes!

## ✅ Prerequisites

- Node.js 18+ installed
- MongoDB running (local or Atlas)
- OpenAI API key
- Stripe account (test mode)

---

## 🚀 Installation

### 1. Install pnpm (if not installed)

```bash
npm install -g pnpm
```

### 2. Install dependencies

```bash
pnpm install
```

---

## ⚙️ Configuration

### 3. Backend Environment

Create `apps/api/.env`:

```bash
# Copy from example (or manually create)
# Minimum required for development:

NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
WEB_URL=http://localhost:3000

# MongoDB (use your connection string)
DATABASE_URL=mongodb://localhost:27017/quizflow

# JWT Secrets (generate new ones)
JWT_ACCESS_SECRET=your-secret-key-change-me
JWT_REFRESH_SECRET=your-secret-key-change-me

# OpenAI (get from platform.openai.com)
OPENAI_API_KEY=sk-your-key-here

# Stripe (get from dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_your-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-key-here
STRIPE_PRO_PRICE_ID=price_your-price-id-here

# Defaults
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:3000
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
```

### 4. Frontend Environment

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key-here
```

---

## 🗄️ Database Setup

### 5. Generate Prisma Client

```bash
cd apps/api
pnpm prisma:generate
```

### 6. Push Database Schema

```bash
pnpm prisma:push
```

### 7. Seed Database (Optional)

```bash
pnpm prisma:seed
```

This creates test accounts:
- **Free**: free@example.com / Free123!
- **Pro**: pro@example.com / Pro123!
- **Admin**: admin@quizflow.ai / Admin123!

---

## ▶️ Run the Application

### 8. Start Development Servers

**Option A: Run both (from root)**
```bash
pnpm dev
```

**Option B: Run separately**

Terminal 1 (Backend):
```bash
cd apps/api
pnpm dev
```

Terminal 2 (Frontend):
```bash
cd apps/web
pnpm dev
```

---

## 🎉 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health

---

## 🧪 Test It Out!

### 1. Register Account

Go to: http://localhost:3000/register

Or login with seeded account:
- Email: `free@example.com`
- Password: `Free123!`

### 2. Upload a File

1. Go to Dashboard
2. Click "Choose File"
3. Select a PDF, DOCX, or TXT file
4. Click "Generate Quiz"

### 3. Download QTI

Once generated, click "Download" to get the ZIP file.

### 4. Import to Canvas

1. Go to Canvas LMS
2. Navigate to your course
3. Go to Quizzes
4. Click "Import Quiz"
5. Upload the downloaded ZIP file

---

## 🛠️ Development Tools

### Prisma Studio (Database GUI)

```bash
cd apps/api
pnpm prisma:studio
```

Opens at: http://localhost:5555

### View Logs

Backend logs are in console. Check for errors!

---

## ❓ Troubleshooting

### MongoDB Connection Error

```bash
# Check if MongoDB is running
mongosh

# Or start MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Get connection string from atlas.mongodb.com
```

### Port Already in Use

```bash
# Kill process on port 5000
npx kill-port 5000

# Or change port in .env
PORT=5001
```

### OpenAI API Error

- Check your API key is correct
- Verify you have credits/billing enabled
- Check rate limits

### Stripe Error

- Use test mode keys (sk_test_...)
- Verify webhook secret if testing webhooks
- Check Stripe dashboard for errors

### Build Errors

```bash
# Clear everything and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

---

## 📚 Next Steps

### Learn More

1. Read [LEARNING_GUIDE.md](./LEARNING_GUIDE.md) - Understand the concepts
2. Read [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - See what's built
3. Read [DEPLOYMENT.md](./DEPLOYMENT.md) - Deploy to production

### Explore Code

All code is heavily commented! Start here:

1. **Backend Entry**: `apps/api/src/server.ts`
2. **API Routes**: `apps/api/src/routes/`
3. **Frontend Entry**: `apps/web/src/app/layout.tsx`
4. **Landing Page**: `apps/web/src/app/page.tsx`

### Modify & Extend

Try these exercises:

1. Change the color scheme in `tailwind.config.ts`
2. Add a new API endpoint
3. Add a new page to the frontend
4. Modify the quiz generation prompt
5. Add email notifications

---

## 🆘 Need Help?

### Check These First

1. **Console errors** - Look in browser dev tools and terminal
2. **Environment variables** - Are they all set correctly?
3. **MongoDB connection** - Is it running and accessible?
4. **API keys** - Are they valid and have proper permissions?

### Documentation

- [SETUP.md](./SETUP.md) - Detailed installation
- [LEARNING_GUIDE.md](./LEARNING_GUIDE.md) - Concepts explained
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing strategies
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment

### Common Issues

**"Cannot find module"**
- Run `pnpm install` again
- Check if you're in the right directory

**"Database connection failed"**
- Verify DATABASE_URL in .env
- Check MongoDB is running
- Check network/firewall

**"Unauthorized / 401 error"**
- Check if logged in
- Verify JWT_ACCESS_SECRET matches
- Token might be expired (try logging in again)

---

## 🎓 Learning Path

### Beginner Path

1. ✅ Get it running (this guide)
2. 📖 Read [LEARNING_GUIDE.md](./LEARNING_GUIDE.md)
3. 🔍 Explore codebase (follow comments)
4. ✏️ Make small changes
5. 🧪 Add tests

### Intermediate Path

1. ➕ Add new features
2. 🎨 Customize UI
3. 🔧 Optimize performance
4. 🚀 Deploy to production
5. 📊 Add analytics

### Advanced Path

1. 🏗️ Refactor architecture
2. ⚡ Add caching (Redis)
3. 📧 Add email service
4. 🤝 Add team features
5. 📈 Scale infrastructure

---

## ✨ You're Ready!

Your QuizFlow AI application is now running!

**What you have:**
- ✅ Full-stack SaaS application
- ✅ AI-powered quiz generation
- ✅ Payment integration
- ✅ Canvas LMS compatibility
- ✅ Production-ready architecture

**What you learned:**
- 🎓 Full-stack development
- 🏗️ System architecture
- 🔐 Authentication & security
- 💳 Payment integration
- 🤖 AI API integration
- 🚀 Production patterns

---

## 🎯 Quick Commands Reference

```bash
# Development
pnpm dev                    # Run all
pnpm --filter @quizflow/api dev   # Backend only
pnpm --filter @quizflow/web dev   # Frontend only

# Database
pnpm --filter @quizflow/api prisma:studio  # Open GUI
pnpm --filter @quizflow/api prisma:push    # Update schema

# Build
pnpm build                  # Build all
pnpm --filter @quizflow/api build   # Backend
pnpm --filter @quizflow/web build   # Frontend

# Testing
pnpm test                   # Run tests
pnpm test -- --ui          # UI mode
pnpm test -- --coverage    # With coverage

# Linting
pnpm lint                   # Lint all
pnpm format                 # Format code
```

---

**Happy Building! 🚀**

Now go create something amazing with what you've learned!

