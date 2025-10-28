# QuizFlow AI - Setup Guide 🚀

This guide will help you set up and run the QuizFlow AI application from scratch.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **pnpm** >= 8.0.0 (Install: `npm install -g pnpm`)
- **MongoDB** (Local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Git**

## 🔑 Required API Keys

You'll need to obtain the following API keys:

1. **OpenAI API Key**
   - Sign up at [OpenAI](https://platform.openai.com/)
   - Go to API Keys section
   - Create a new API key

2. **Stripe Account** (for payments)
   - Sign up at [Stripe](https://stripe.com/)
   - Get your test mode API keys from Dashboard
   - Create a product and get the Price ID

3. **MongoDB Connection String**
   - For local: `mongodb://localhost:27017/quizflow`
   - For Atlas: Get connection string from your cluster

## 🛠️ Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd QuizFlow-AI
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install dependencies for all workspaces (backend, frontend, shared packages).

### 3. Environment Configuration

#### Backend (.env)

Create `apps/api/.env` file:

```bash
# Server Configuration
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
WEB_URL=http://localhost:3000

# Database
DATABASE_URL=mongodb://localhost:27017/quizflow

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=your-super-secret-access-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PRO_PRICE_ID=price_your-pro-plan-price-id

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env.local)

Create `apps/web/.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
```

### 4. Database Setup

#### Generate Prisma Client

```bash
cd apps/api
pnpm prisma:generate
```

#### Push Database Schema

```bash
pnpm prisma:push
```

#### Seed Database (optional - creates demo accounts)

```bash
pnpm prisma:seed
```

This creates 3 test accounts:
- **Admin**: admin@quizflow.ai / Admin123!
- **Free User**: free@example.com / Free123!
- **Pro User**: pro@example.com / Pro123!

### 5. Create Required Directories

```bash
mkdir -p apps/api/uploads
mkdir -p apps/api/uploads/qti
mkdir -p apps/api/temp
mkdir -p apps/api/logs
```

## 🚀 Running the Application

### Development Mode

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd apps/api
pnpm dev
```

Backend will run on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd apps/web
pnpm dev
```

Frontend will run on `http://localhost:3000`

**Or run both simultaneously from root:**
```bash
pnpm dev
```

## 🧪 Testing the Application

### 1. Access the Frontend

Open your browser and go to `http://localhost:3000`

### 2. Register/Login

- Register a new account, or
- Login with demo account: `free@example.com` / `Free123!`

### 3. Upload a File

1. Go to Dashboard
2. Upload a PDF, DOCX, or TXT file (sample lecture content)
3. Set number of questions (5 for free, up to 30 for pro)
4. Click "Generate Quiz"

### 4. Download QTI Package

Once generated, download the ZIP file and import it into Canvas LMS.

## 📦 Building for Production

### Backend

```bash
cd apps/api
pnpm build
pnpm start
```

### Frontend

```bash
cd apps/web
pnpm build
pnpm start
```

## 🐳 Docker Setup (Optional)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  api:
    build: ./apps/api
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mongodb://mongodb:27017/quizflow
    depends_on:
      - mongodb

  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5000
    depends_on:
      - api

volumes:
  mongodb_data:
```

Run with:
```bash
docker-compose up
```

## 🔧 Troubleshooting

### Common Issues

1. **Port already in use**
   - Change PORT in `.env` files
   - Or kill process: `lsof -ti:5000 | xargs kill`

2. **MongoDB connection failed**
   - Ensure MongoDB is running
   - Check connection string in `.env`

3. **OpenAI API errors**
   - Verify API key is correct
   - Check billing/quota in OpenAI dashboard

4. **File upload fails**
   - Check MAX_FILE_SIZE setting
   - Ensure upload directories exist

5. **Prisma errors**
   - Regenerate client: `pnpm prisma:generate`
   - Reset database: `pnpm prisma:push --force-reset`

## 📚 Learn More

### Project Structure

```
quizflow-ai/
├── apps/
│   ├── api/          # Express backend
│   │   ├── src/
│   │   │   ├── config/      # Configuration
│   │   │   ├── controllers/ # Route handlers
│   │   │   ├── middleware/  # Middleware functions
│   │   │   ├── routes/      # API routes
│   │   │   ├── services/    # Business logic
│   │   │   └── server.ts    # Entry point
│   │   └── prisma/          # Database schema
│   │
│   └── web/          # Next.js frontend
│       └── src/
│           ├── app/          # Pages (App Router)
│           ├── components/   # React components
│           └── lib/          # Utilities
│
└── packages/
    └── types/        # Shared TypeScript types
```

### Key Technologies

- **Backend**: Express, TypeScript, Prisma, OpenAI
- **Frontend**: Next.js 14, React 18, Tailwind CSS, React Query
- **Database**: MongoDB
- **Auth**: JWT with access/refresh tokens
- **Payments**: Stripe Checkout & Webhooks

### Architecture Patterns

- **Monorepo**: pnpm workspaces for code sharing
- **MVC Pattern**: Separation of concerns
- **Service Layer**: Business logic isolation
- **Type Safety**: Shared types across stack
- **Error Handling**: Centralized error middleware

## 🤝 Contributing

This is a learning project! Feel free to:
- Add new features
- Improve documentation
- Report bugs
- Suggest enhancements

## 📝 License

MIT License - see [LICENSE](./LICENSE) file

## 🆘 Need Help?

- Check the [README.md](./README.md) for overview
- Review inline code comments (they're extensive!)
- Open an issue on GitHub

---

**Happy Learning! 🎓**

Remember: This project is designed to teach production-grade full-stack development.
Every decision and pattern used here is explained in comments throughout the codebase.

