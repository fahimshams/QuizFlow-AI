# QuizFlow AI 🎓

> AI-powered quiz generation SaaS that converts lecture materials into Canvas LMS-compatible quizzes

## 🚀 Tech Stack

### Frontend (Next.js)
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Query** for state management
- Modern, accessible UI components

### Backend (Express)
- **Node.js + Express** with TypeScript
- **MongoDB** with Prisma ORM
- **OpenAI API** for quiz generation
- **Stripe** for subscription management
- **QTI 2.1** XML generation

### Shared
- **TypeScript** across the stack
- **pnpm workspaces** for monorepo
- **ESLint + Prettier** for code quality

## 📁 Project Structure

```
quizflow-ai/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Express backend
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── ui/           # Shared React components
│   └── config/       # Shared configuration
├── docs/             # Documentation
└── scripts/          # Build and deployment scripts
```

## 🛠️ Development Setup

### Prerequisites
- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **MongoDB** (local or Atlas)
- **OpenAI API Key**
- **Stripe Account** (test mode)

### Installation

```bash
# Install pnpm if you haven't
npm install -g pnpm

# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Run development servers
pnpm dev
```

The frontend will be at `http://localhost:3000`  
The backend will be at `http://localhost:5000`

## 📦 Available Scripts

```bash
pnpm dev          # Run all apps in development mode
pnpm build        # Build all apps for production
pnpm lint         # Lint all apps
pnpm format       # Format code with Prettier
pnpm type-check   # Type check TypeScript
pnpm test         # Run all tests
```

## 🏗️ Features

- ✅ Upload lecture files (PDF, DOCX, TXT)
- ✅ AI-powered quiz generation with GPT-4
- ✅ Export to QTI 2.1 format (Canvas compatible)
- ✅ Freemium model with Stripe subscriptions
- ✅ User dashboard and history
- ✅ Usage tracking and limits

## 🔐 Environment Variables

See `.env.example` files in each app directory.

## 📝 License

MIT - see [LICENSE](./LICENSE)

## 🤝 Contributing

This is a learning project. Contributions welcome!

---

Built with ❤️ as a learning journey into production-grade full-stack development
