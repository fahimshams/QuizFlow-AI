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
- **PostgreSQL** with Prisma ORM (Azure Database for PostgreSQL–compatible)
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
├── docker-compose.yml   # Local PostgreSQL (dev)
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
- **Docker Desktop** (or Docker Engine + Compose) for a local PostgreSQL instance
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
cp apps/web/.env.example apps/web/.env.local
```

### Local PostgreSQL (Docker)

Use the included Compose file so your `DATABASE_URL` in `apps/api/.env` matches a known-good local database (same credentials as `apps/api/.env.example`).

```bash
# Start PostgreSQL 16 (listens on localhost:5432)
pnpm db:up

# Apply Prisma migrations and generate the client
pnpm db:migrate
pnpm --filter @quizflow/api prisma:generate

# Optional: seed dev users (see apps/api/prisma/seed.ts)
pnpm db:seed

# API + web
pnpm dev
```

Stop the database container when finished: `pnpm db:down`. Data is kept in the Docker volume until you remove it.

### Azure PostgreSQL (after local testing)

1. Create **Azure Database for PostgreSQL Flexible Server** and a database (for example `quizflow`).
2. In **Networking**, allow your app host (Azure App Service outbound IPs, your office IP for testing, etc.).
3. Set `DATABASE_URL` in **production** `apps/api` settings to your Azure connection string, including TLS, for example:

   `postgresql://USER@SERVERNAME:PASSWORD@HOST.postgres.database.azure.com:5432/quizflow?sslmode=require`

4. From CI or a release step (with `DATABASE_URL` pointing at Azure), run:

   `pnpm --filter @quizflow/api exec prisma migrate deploy`

   Do **not** use `prisma migrate dev` against production; it is for local schema iteration only.

The frontend will be at `http://localhost:3000`  
The backend will be at `http://localhost:5000`

## 📦 Available Scripts

```bash
pnpm dev          # Run all apps in development mode
pnpm build        # Build all apps for production
pnpm lint         # Lint all apps
pnpm format       # Format code with Prettier
pnpm type-check   # Type check TypeScript
pnpm db:up        # Start local PostgreSQL (Docker Compose)
pnpm db:down      # Stop local PostgreSQL
pnpm db:migrate   # Apply Prisma migrations to the DB in DATABASE_URL
pnpm db:seed      # Run Prisma seed (apps/api)
pnpm db:studio    # Open Prisma Studio for apps/api
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
