# QuizFlow AI - Senior Engineer Deployment Guide 🚀

> **A comprehensive production deployment guide from a senior engineer's perspective**

This document provides battle-tested strategies, architectural decisions, and step-by-step instructions for deploying QuizFlow AI to production. It covers everything from initial setup to scaling at enterprise levels.

---

## 📋 Table of Contents

1. [Pre-Deployment Assessment](#pre-deployment-assessment)
2. [Architecture Overview](#architecture-overview)
3. [Environment Configuration](#environment-configuration)
4. [Deployment Strategies](#deployment-strategies)
5. [Database Setup & Migration](#database-setup--migration)
6. [Security Hardening](#security-hardening)
7. [Monitoring & Observability](#monitoring--observability)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Scaling Strategy](#scaling-strategy)
10. [Disaster Recovery](#disaster-recovery)
11. [Performance Optimization](#performance-optimization)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Pre-Deployment Assessment

### Critical Prerequisites Checklist

Before deploying, ensure you have:

- [ ] **Domain name** registered and DNS access
- [ ] **SSL certificate** (Let's Encrypt or commercial)
- [ ] **MongoDB Atlas** account or self-hosted MongoDB cluster
- [ ] **OpenAI API key** with sufficient credits/quota
- [ ] **Stripe account** (production mode) with webhook endpoint configured
- [ ] **Cloud provider account** (AWS/GCP/Azure/DigitalOcean/Railway)
- [ ] **GitHub/GitLab** repository with CI/CD access
- [ ] **Monitoring service** account (Sentry, DataDog, New Relic)
- [ ] **Email service** (SendGrid, AWS SES, Mailgun) for notifications
- [ ] **CDN** configured (Cloudflare, CloudFront, or Vercel Edge)

### Resource Requirements

**Minimum Production Setup:**
- **Backend**: 2 vCPU, 4GB RAM, 20GB storage
- **Frontend**: Static hosting (Vercel/Netlify) or 1 vCPU, 2GB RAM
- **Database**: MongoDB Atlas M10 (2GB RAM) or equivalent
- **File Storage**: 100GB+ (S3, Cloudflare R2, or local with backups)

**Recommended for Scale:**
- **Backend**: 4 vCPU, 8GB RAM, auto-scaling enabled
- **Database**: MongoDB Atlas M30+ with replica set
- **File Storage**: S3-compatible object storage with CDN
- **CDN**: Global distribution for static assets

---

## 🏗️ Architecture Overview

### Recommended Production Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CDN (Cloudflare)                      │
│              (Static assets, caching)                    │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐      ┌────────▼────────┐
│   Frontend     │      │   API Gateway   │
│   (Next.js)    │      │  (Load Balancer)│
│   Vercel/      │      │                 │
│   Static Host  │      └────────┬────────┘
└────────────────┘               │
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
            ┌───────▼───┐  ┌─────▼────┐  ┌───▼──────┐
            │ API Pod 1 │  │API Pod 2│  │API Pod N │
            │ (Express) │  │(Express)│  │(Express) │
            └─────┬─────┘  └────┬─────┘  └────┬─────┘
                  │             │             │
                  └─────────────┼─────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
            ┌───────▼──────┐      ┌─────────▼────────┐
            │   MongoDB    │      │  Object Storage  │
            │   (Atlas)    │      │  (S3/R2)         │
            │  Replica Set │      │  (File uploads)  │
            └──────────────┘      └──────────────────┘
```

### Key Architectural Decisions

1. **Monorepo Structure**: Keep frontend and backend in separate deployable units
2. **Stateless Backend**: All API instances are stateless (JWT-based auth, no sessions)
3. **External File Storage**: Never store files on server disk (use S3/R2)
4. **Database Replication**: Always use MongoDB replica set for high availability
5. **CDN for Static Assets**: Offload static content to reduce server load
6. **Horizontal Scaling**: Design for multiple API instances behind load balancer

---

## ⚙️ Environment Configuration

### Backend Environment Variables

Create a comprehensive `.env` file for production:

```bash
# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=production
PORT=5000
API_URL=https://api.yourdomain.com
WEB_URL=https://yourdomain.com

# ============================================
# DATABASE
# ============================================
# MongoDB Atlas connection string (use replica set)
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/quizflow?retryWrites=true&w=majority

# ============================================
# JWT SECRETS (CRITICAL: Generate new secrets!)
# ============================================
# Generate with: openssl rand -base64 64
JWT_ACCESS_SECRET=<64-character-random-string>
JWT_REFRESH_SECRET=<64-character-random-string>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# ============================================
# OPENAI API
# ============================================
OPENAI_API_KEY=sk-proj-...
# Optional: Set organization ID for usage tracking
OPENAI_ORG_ID=org-...

# ============================================
# STRIPE (PRODUCTION KEYS)
# ============================================
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...

# ============================================
# FILE UPLOAD CONFIGURATION
# ============================================
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=/app/uploads  # Use absolute path in production

# For production, use S3-compatible storage:
# AWS_S3_BUCKET=quizflow-uploads
# AWS_S3_REGION=us-east-1
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # Per window

# ============================================
# CORS
# ============================================
CORS_ORIGIN=https://yourdomain.com

# ============================================
# MONITORING & LOGGING
# ============================================
# Sentry for error tracking
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ENVIRONMENT=production

# Logging service (optional)
LOGTAIL_TOKEN=...
# Or CloudWatch
AWS_CLOUDWATCH_LOG_GROUP=/aws/ecs/quizflow-api

# ============================================
# EMAIL SERVICE (for notifications)
# ============================================
# SendGrid
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Or AWS SES
# AWS_SES_REGION=us-east-1
# AWS_SES_FROM_EMAIL=noreply@yourdomain.com
```

### Frontend Environment Variables

Create `apps/web/.env.production`:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Optional: Analytics
NEXT_PUBLIC_GA_ID=G-...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

### Security Best Practices for Environment Variables

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use secrets manager** - AWS Secrets Manager, HashiCorp Vault, or platform-native secrets
3. **Rotate secrets regularly** - Especially JWT secrets and API keys
4. **Use different secrets per environment** - Dev, staging, production
5. **Limit access** - Only necessary services should have access to secrets

---

## 🚀 Deployment Strategies

### Strategy 1: Vercel (Frontend) + Railway (Backend) - **Recommended for MVP**

**Pros:**
- Fastest setup (30 minutes)
- Minimal DevOps knowledge required
- Auto-scaling built-in
- Free tier available

**Cons:**
- Less control over infrastructure
- Vendor lock-in
- Higher costs at scale

#### Step-by-Step: Railway Backend

1. **Sign up at [Railway.app](https://railway.app/)**

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Set root directory to `apps/api`

3. **Add MongoDB Service**
   - Click "New" → "Database" → "MongoDB"
   - Railway automatically creates connection string
   - Copy the `MONGO_URL` variable

4. **Configure Environment Variables**
   - Go to your service → Variables
   - Add all variables from the backend `.env` template above
   - Use Railway's generated MongoDB URL for `DATABASE_URL`

5. **Set Build & Start Commands**
   - Build Command: `pnpm install && pnpm prisma:generate && pnpm build`
   - Start Command: `pnpm start`
   - Root Directory: `apps/api`

6. **Configure Domain**
   - Go to Settings → Networking
   - Generate domain or add custom domain
   - Copy the API URL to your frontend env vars

7. **Deploy Database Schema**
   - Once deployed, SSH into the service or use Railway CLI:
   ```bash
   railway run pnpm prisma:push
   ```

#### Step-by-Step: Vercel Frontend

1. **Sign up at [Vercel](https://vercel.com/)**

2. **Import Repository**
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Framework Preset: Next.js

3. **Configure Build Settings**
   - Root Directory: `apps/web`
   - Build Command: `cd ../.. && pnpm install && cd apps/web && pnpm build`
   - Output Directory: `.next` (default)
   - Install Command: `pnpm install`

4. **Set Environment Variables**
   - Go to Settings → Environment Variables
   - Add `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Set for "Production" environment

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Get your production URL

6. **Configure Custom Domain**
   - Go to Settings → Domains
   - Add your domain
   - Update DNS records as instructed

---

### Strategy 2: AWS Full Stack - **Recommended for Scale**

**Pros:**
- Complete control
- Enterprise-grade reliability
- Cost-effective at scale
- Industry-standard infrastructure

**Cons:**
- Complex setup
- Requires AWS knowledge
- Higher initial time investment

#### Architecture Components

- **Frontend**: S3 + CloudFront
- **Backend**: ECS Fargate + Application Load Balancer
- **Database**: DocumentDB (MongoDB-compatible) or MongoDB Atlas
- **File Storage**: S3
- **Secrets**: AWS Secrets Manager
- **Monitoring**: CloudWatch + X-Ray

#### Step-by-Step: AWS Deployment

##### 1. Prepare Docker Images

Create `apps/api/Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.15.4

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @quizflow/api build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./

# Generate Prisma Client
RUN pnpm prisma:generate

# Create uploads directory
RUN mkdir -p /app/uploads /app/temp

EXPOSE 5000

CMD ["node", "dist/server.js"]
```

Create `apps/web/Dockerfile`:

```dockerfile
FROM node:18-alpine AS base
RUN npm install -g pnpm@8.15.4

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @quizflow/web build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["pnpm", "start"]
```

##### 2. Create ECR Repositories

```bash
# Backend
aws ecr create-repository --repository-name quizflow-api --region us-east-1
# Frontend (if using ECS)
aws ecr create-repository --repository-name quizflow-web --region us-east-1
```

##### 3. Build and Push Images

```bash
# Authenticate
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd apps/api
docker build -t quizflow-api .
docker tag quizflow-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/quizflow-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/quizflow-api:latest
```

##### 4. Create ECS Cluster and Service

Use AWS Console or Terraform/CloudFormation. Key components:

- **ECS Cluster**: Fargate-based
- **Task Definition**: Includes environment variables from Secrets Manager
- **Service**: Auto-scaling enabled (2-10 tasks)
- **Load Balancer**: Application Load Balancer with HTTPS
- **Target Group**: Health check on `/health` endpoint

##### 5. Deploy Frontend to S3 + CloudFront

```bash
# Build Next.js static export
cd apps/web
pnpm build
pnpm export  # If using static export

# Upload to S3
aws s3 sync out/ s3://quizflow-frontend --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

---

### Strategy 3: Docker Compose on VPS - **Recommended for Budget**

**Pros:**
- Full control
- Cost-effective ($5-20/month)
- Good for learning

**Cons:**
- Manual scaling
- You manage updates
- Single point of failure (unless clustered)

#### Step-by-Step: VPS Deployment

1. **Provision VPS** (DigitalOcean, Linode, Hetzner)
   - Minimum: 2 vCPU, 4GB RAM, 50GB SSD
   - Recommended: 4 vCPU, 8GB RAM, 100GB SSD

2. **Initial Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh

   # Install Docker Compose
   sudo apt install docker-compose -y

   # Install Node.js (for Prisma CLI)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install pnpm
   npm install -g pnpm
   ```

3. **Clone Repository**
   ```bash
   git clone <your-repo-url> quizflow-ai
   cd quizflow-ai
   ```

4. **Create Production docker-compose.yml**
   ```yaml
   version: '3.8'

   services:
     mongodb:
       image: mongo:7.0
       restart: always
       environment:
         MONGO_INITDB_ROOT_USERNAME: ${MONGO_USERNAME}
         MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
       volumes:
         - mongodb_data:/data/db
       networks:
         - app-network
       ports:
         - "127.0.0.1:27017:27017"  # Only localhost

     api:
       build:
         context: .
         dockerfile: apps/api/Dockerfile
       restart: always
       ports:
         - "127.0.0.1:5000:5000"  # Only localhost, use Nginx reverse proxy
       environment:
         NODE_ENV: production
         DATABASE_URL: mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@mongodb:27017/quizflow?authSource=admin
         # Add all other env vars
       depends_on:
         - mongodb
       networks:
         - app-network
       volumes:
         - ./uploads:/app/uploads

     web:
       build:
         context: .
         dockerfile: apps/web/Dockerfile
       restart: always
       ports:
         - "127.0.0.1:3000:3000"
       environment:
         NEXT_PUBLIC_API_URL: https://api.yourdomain.com
       depends_on:
         - api
       networks:
         - app-network

     nginx:
       image: nginx:alpine
       restart: always
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx.conf:/etc/nginx/nginx.conf
         - ./ssl:/etc/nginx/ssl
         - certbot-etc:/etc/letsencrypt
       depends_on:
         - web
         - api
       networks:
         - app-network

     certbot:
       image: certbot/certbot
       volumes:
         - certbot-etc:/etc/letsencrypt
       command: certonly --webroot --webroot-path=/var/www/certbot --email your@email.com --agree-tos --no-eff-email -d yourdomain.com -d api.yourdomain.com

   volumes:
     mongodb_data:
     certbot-etc:

   networks:
     app-network:
       driver: bridge
   ```

5. **Create Nginx Configuration**
   ```nginx
   # nginx.conf
   upstream api {
       server api:5000;
   }

   upstream web {
       server web:3000;
   }

   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

       location / {
           proxy_pass http://web;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }

   server {
       listen 443 ssl http2;
       server_name api.yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

       location / {
           proxy_pass http://api;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

6. **Create .env file**
   ```bash
   MONGO_USERNAME=admin
   MONGO_PASSWORD=<strong-password>
   # ... all other env vars
   ```

7. **Deploy**
   ```bash
   # Build and start
   docker-compose up -d --build

   # Run database migrations
   docker-compose exec api pnpm prisma:push

   # View logs
   docker-compose logs -f
   ```

8. **Setup SSL with Let's Encrypt**
   ```bash
   # Initial certificate
   docker-compose run --rm certbot

   # Auto-renewal cron job
   echo "0 0 * * * cd /path/to/quizflow-ai && docker-compose run --rm certbot renew && docker-compose restart nginx" | crontab -
   ```

---

## 🗄️ Database Setup & Migration

### MongoDB Atlas Setup (Recommended)

1. **Create Cluster**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create new cluster (M10 minimum for production)
   - Choose region closest to your API servers
   - Enable backup (automated snapshots)

2. **Configure Network Access**
   - Add IP whitelist (0.0.0.0/0 for cloud services, or specific IPs)
   - Or use VPC peering for AWS

3. **Create Database User**
   - Database Access → Add New User
   - Username: `quizflow-admin`
   - Password: Generate strong password
   - Role: `readWrite` on `quizflow` database

4. **Get Connection String**
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your password
   - Add `?retryWrites=true&w=majority` for replica set

5. **Enable Replica Set** (Critical for production)
   - Always use replica set (even single node)
   - Provides high availability
   - Enables transactions

### Running Migrations

```bash
# Generate Prisma Client
cd apps/api
pnpm prisma:generate

# Push schema to database (development)
pnpm prisma:push

# Or create migration (production)
pnpm prisma:migrate dev --name init

# Apply migrations in production
pnpm prisma:migrate deploy
```

### Database Backup Strategy

**Automated Backups (MongoDB Atlas):**
- Enable continuous backup
- Retention: 7 days minimum, 30 days recommended
- Point-in-time recovery enabled

**Manual Backup Script:**
```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
MONGO_URI="mongodb+srv://..."

mkdir -p $BACKUP_DIR

# Backup
mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR/backup_$DATE"

# Compress
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" "$BACKUP_DIR/backup_$DATE"
rm -rf "$BACKUP_DIR/backup_$DATE"

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/backup_$DATE.tar.gz" s3://quizflow-backups/

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

---

## 🔒 Security Hardening

### Critical Security Checklist

- [ ] **HTTPS Everywhere**: All traffic encrypted (TLS 1.2+)
- [ ] **Strong JWT Secrets**: 64+ character random strings
- [ ] **Rate Limiting**: Enabled on all public endpoints
- [ ] **CORS Configuration**: Whitelist specific origins only
- [ ] **Input Validation**: All user inputs validated (Zod schemas)
- [ ] **SQL/NoSQL Injection**: Use Prisma (parameterized queries)
- [ ] **XSS Protection**: Helmet.js middleware enabled
- [ ] **CSRF Protection**: For state-changing operations
- [ ] **File Upload Security**: Validate file types, scan for malware
- [ ] **Secrets Management**: Never commit secrets, use secrets manager
- [ ] **Database Security**: Strong passwords, IP whitelisting
- [ ] **Dependency Scanning**: Regular `npm audit` and updates
- [ ] **Security Headers**: Helmet.js configured properly

### Security Headers Configuration

Ensure your Express app uses Helmet:

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### File Upload Security

```typescript
// Validate file types
const allowedMimeTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

// Validate file size
const maxSize = 10 * 1024 * 1024; // 10MB

// Scan files (use ClamAV or cloud service)
// Store in isolated location
// Never execute uploaded files
```

### API Security Best Practices

1. **Authentication**: JWT with short expiration (15min access, 7d refresh)
2. **Authorization**: Role-based access control (RBAC)
3. **Rate Limiting**: Per-user and per-IP limits
4. **Request Validation**: Validate all inputs with Zod
5. **Error Handling**: Don't leak sensitive info in errors
6. **Logging**: Log security events (failed logins, suspicious activity)

---

## 📊 Monitoring & Observability

### Essential Monitoring Stack

1. **Error Tracking**: Sentry
2. **Application Metrics**: DataDog, New Relic, or CloudWatch
3. **Uptime Monitoring**: UptimeRobot, Pingdom
4. **Log Aggregation**: CloudWatch Logs, Logtail, or ELK Stack
5. **Performance Monitoring**: APM tools

### Setting Up Sentry

```typescript
// apps/api/src/server.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new ProfilingIntegration(),
  ],
  tracesSampleRate: 1.0, // 100% in production for critical apps
  profilesSampleRate: 1.0,
});

// Add error handler
app.use(Sentry.Handlers.errorHandler());
```

### Setting Up Application Metrics

```typescript
// Example with Prometheus (if self-hosting)
import promClient from 'prom-client';

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Health Check Endpoint

```typescript
// apps/api/src/routes/health.routes.ts
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'unknown',
    memory: process.memoryUsage(),
  };

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### Logging Strategy

```typescript
// Use structured logging
logger.info('User logged in', {
  userId: user.id,
  email: user.email,
  ip: req.ip,
  userAgent: req.get('user-agent'),
});

// Log errors with context
logger.error('Quiz generation failed', {
  error: error.message,
  stack: error.stack,
  userId: user.id,
  fileId: fileUpload.id,
});
```

### Alerting Rules

Set up alerts for:
- **Error Rate**: > 5% of requests
- **Response Time**: P95 > 2 seconds
- **Database Connection**: Any failures
- **Disk Space**: < 20% free
- **Memory Usage**: > 80%
- **Uptime**: Any downtime
- **API Quota**: OpenAI quota exceeded

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  NODE_VERSION: '18'
  PNPM_VERSION: '8.15.4'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm type-check

      - name: Lint
        run: pnpm lint

      - name: Run tests
        run: pnpm test

      - name: Build
        run: pnpm build

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Railway
        run: |
          curl -X POST ${{ secrets.RAILWAY_WEBHOOK_URL }}
        # Or use Railway CLI
        # - name: Install Railway CLI
        #   run: npm install -g @railway/cli
        # - name: Deploy
        #   run: railway up
        #   env:
        #     RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./apps/web
```

### Deployment Strategy

1. **Branch Protection**: Require PR reviews before merging to `main`
2. **Automated Testing**: All tests must pass before deployment
3. **Staging Environment**: Deploy to staging first, then production
4. **Blue-Green Deployment**: For zero-downtime updates
5. **Rollback Plan**: Keep previous version ready for quick rollback

---

## 📈 Scaling Strategy

### When to Scale

**Scale Up (Vertical):**
- CPU consistently > 70%
- Memory consistently > 80%
- Single server can handle load

**Scale Out (Horizontal):**
- Need high availability
- Traffic spikes expected
- Geographic distribution needed

### Scaling Backend API

**Stateless Design** (Already implemented):
- ✅ JWT-based auth (no server-side sessions)
- ✅ External database (MongoDB)
- ✅ External file storage (S3)

**Load Balancing:**
```
Load Balancer (ALB/NGINX)
    ├── API Instance 1
    ├── API Instance 2
    └── API Instance 3
```

**Auto-Scaling Configuration:**
- Min instances: 2
- Max instances: 10
- Scale up: CPU > 70% for 5 minutes
- Scale down: CPU < 30% for 15 minutes

### Scaling Database

**MongoDB Atlas Auto-Scaling:**
- Enable auto-scaling on cluster
- Set min/max instance size
- Monitor connection pool usage

**Read Replicas:**
- Add read replicas for read-heavy workloads
- Route read queries to replicas
- Keep writes on primary

**Sharding** (Advanced):
- Shard by `userId` for multi-tenant isolation
- Only needed at very large scale (millions of users)

### Caching Strategy

```typescript
// Redis for session caching (if needed)
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache user data
async function getUser(userId: string) {
  const cached = await redis.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
  return user;
}
```

### CDN Configuration

- **Static Assets**: All `/static/*` files via CDN
- **API Responses**: Cache GET requests (with appropriate TTL)
- **File Downloads**: Serve QTI files via CDN

---

## 🛡️ Disaster Recovery

### Backup Strategy

1. **Database Backups**:
   - Automated daily backups
   - Retention: 30 days
   - Test restore monthly

2. **File Backups**:
   - S3 versioning enabled
   - Cross-region replication
   - Lifecycle policies (move to Glacier after 90 days)

3. **Configuration Backups**:
   - Version control (Git)
   - Secrets in secrets manager with versioning

### Recovery Procedures

**Database Recovery:**
```bash
# Restore from backup
mongorestore --uri="mongodb+srv://..." --archive=backup.archive
```

**Application Recovery:**
- Keep deployment scripts in version control
- Document all manual steps
- Test recovery procedures quarterly

### RTO/RPO Targets

- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 24 hours (daily backups)

---

## ⚡ Performance Optimization

### Backend Optimizations

1. **Database Indexing**:
   ```prisma
   // Add indexes for common queries
   model User {
     email String @unique  // Already indexed
     @@index([stripeCustomerId])
   }

   model Quiz {
     @@index([userId, createdAt])
   }
   ```

2. **Connection Pooling**:
   ```typescript
   // Prisma automatically pools connections
   // Configure pool size in DATABASE_URL
   // ?connection_limit=10&pool_timeout=20
   ```

3. **Response Compression**:
   ```typescript
   import compression from 'compression';
   app.use(compression());
   ```

4. **Request Timeout**:
   ```typescript
   // Set timeout for long-running requests
   server.timeout = 30000; // 30 seconds
   ```

### Frontend Optimizations

1. **Next.js Optimizations**:
   - Enable Image Optimization
   - Use Static Generation where possible
   - Implement ISR (Incremental Static Regeneration)
   - Code splitting with dynamic imports

2. **Bundle Size**:
   ```bash
   # Analyze bundle
   pnpm build --analyze
   ```

3. **Caching Headers**:
   ```typescript
   // next.config.mjs
   async headers() {
     return [
       {
         source: '/static/:path*',
         headers: [
           {
             key: 'Cache-Control',
             value: 'public, max-age=31536000, immutable',
           },
         ],
       },
     ];
   },
   ```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Failed

**Symptoms**: `MongoServerError: connection timed out`

**Solutions**:
- Check IP whitelist in MongoDB Atlas
- Verify connection string format
- Check network connectivity
- Verify credentials

#### 2. CORS Errors

**Symptoms**: `Access-Control-Allow-Origin` errors in browser

**Solutions**:
- Verify `CORS_ORIGIN` env var matches frontend URL exactly
- Check for trailing slashes
- Ensure protocol matches (http vs https)

#### 3. Stripe Webhook Failures

**Symptoms**: Webhooks not received or signature verification fails

**Solutions**:
- Verify webhook secret in environment
- Check webhook endpoint URL in Stripe dashboard
- Ensure endpoint is publicly accessible
- Test with Stripe CLI: `stripe listen --forward-to localhost:5000/api/subscription/webhook`

#### 4. File Upload Failures

**Symptoms**: `MulterError: File too large` or disk space errors

**Solutions**:
- Check `MAX_FILE_SIZE` setting
- Verify disk space on server
- Move to S3-compatible storage
- Check file permissions on upload directory

#### 5. Build Failures

**Symptoms**: Build errors in CI/CD or deployment

**Solutions**:
- Clear `node_modules` and reinstall
- Check Node.js version matches (18+)
- Verify pnpm version (8.15.4)
- Check for TypeScript errors: `pnpm type-check`

#### 6. High Memory Usage

**Symptoms**: Server crashes or slow performance

**Solutions**:
- Check for memory leaks (use `node --inspect`)
- Increase server memory
- Optimize database queries
- Implement pagination
- Add caching layer

### Debugging Commands

```bash
# Check application logs
docker-compose logs -f api

# Check database connection
docker-compose exec api pnpm prisma studio

# Test API health
curl https://api.yourdomain.com/health

# Check environment variables
docker-compose exec api env | grep -E 'DATABASE|JWT|STRIPE'

# Monitor resource usage
docker stats

# Database query performance
# Use MongoDB Compass or Atlas Performance Advisor
```

---

## ✅ Pre-Launch Checklist

### Security
- [ ] All secrets in secrets manager (not in code)
- [ ] HTTPS enabled everywhere
- [ ] Security headers configured (Helmet)
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] File upload validation and scanning
- [ ] Dependency vulnerabilities fixed (`pnpm audit`)

### Performance
- [ ] Database indexes created
- [ ] CDN configured for static assets
- [ ] Response compression enabled
- [ ] Image optimization enabled
- [ ] Bundle size optimized
- [ ] Caching strategy implemented

### Monitoring
- [ ] Error tracking configured (Sentry)
- [ ] Application metrics configured
- [ ] Uptime monitoring active
- [ ] Log aggregation set up
- [ ] Alerts configured
- [ ] Health check endpoint working

### Infrastructure
- [ ] Database backups automated
- [ ] File backups configured
- [ ] SSL certificates valid and auto-renewing
- [ ] Domain DNS configured correctly
- [ ] Load balancer health checks passing
- [ ] Auto-scaling configured (if applicable)

### Business Logic
- [ ] Stripe webhooks tested
- [ ] Email notifications working
- [ ] User registration/login tested
- [ ] File upload/download tested
- [ ] Quiz generation tested end-to-end
- [ ] QTI export tested and validated

### Documentation
- [ ] API documentation updated
- [ ] Runbook created for common operations
- [ ] Incident response plan documented
- [ ] Contact information for on-call engineer

---

## 🚀 Launch Day Checklist

### Pre-Launch (Day Before)
- [ ] Final security audit
- [ ] Load testing completed
- [ ] Backup restore tested
- [ ] Rollback procedure tested
- [ ] Team briefed on launch plan

### Launch Day
- [ ] Deploy to production
- [ ] Verify all services healthy
- [ ] Smoke test all critical paths
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify payments processing
- [ ] Test email notifications

### Post-Launch (First 24 Hours)
- [ ] Monitor continuously
- [ ] Review error logs hourly
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Fix critical bugs immediately
- [ ] Document any issues encountered

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Review error logs
- Check performance metrics
- Review security alerts
- Update dependencies (patch versions)

**Monthly:**
- Update dependencies (minor versions)
- Review and optimize database queries
- Check backup restore procedure
- Review and update documentation

**Quarterly:**
- Security audit
- Performance review
- Cost optimization review
- Disaster recovery drill

### On-Call Responsibilities

- Monitor alerts 24/7
- Respond to incidents within SLA
- Escalate critical issues
- Document incidents and resolutions

---

## 🎓 Final Notes

This guide represents production-grade deployment practices. As a senior engineer, remember:

1. **Start Simple**: Begin with Vercel + Railway, scale as needed
2. **Monitor Everything**: You can't fix what you can't see
3. **Automate Everything**: Manual processes fail under pressure
4. **Plan for Failure**: Design for resilience from day one
5. **Document Decisions**: Future you will thank present you
6. **Test Recovery**: Backups are useless if you can't restore them

**Good luck with your deployment! 🚀**

---

*Last Updated: [Current Date]*
*Maintained by: [Your Team]*

