# Deployment Guide 🚀

Complete guide for deploying QuizFlow AI to production.

## 🎯 Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend)
**Best for**: Quick deployment, minimal DevOps

### Option 2: AWS (Full Stack)
**Best for**: Complete control, scalability

### Option 3: DigitalOcean App Platform
**Best for**: Balance of simplicity and control

### Option 4: Docker + Any Cloud
**Best for**: Maximum portability

---

## 📦 Option 1: Vercel + Railway

### Backend (Railway)

1. **Sign up at [Railway.app](https://railway.app/)**

2. **Create New Project**
   - Connect GitHub repository
   - Select `apps/api` as root directory

3. **Add MongoDB**
   - Click "New" → "Database" → "MongoDB"
   - Copy connection string

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=<mongodb-url>
   JWT_ACCESS_SECRET=<generate-with-openssl>
   JWT_REFRESH_SECRET=<generate-with-openssl>
   OPENAI_API_KEY=<your-key>
   STRIPE_SECRET_KEY=<your-key>
   STRIPE_WEBHOOK_SECRET=<your-key>
   STRIPE_PRO_PRICE_ID=<your-price-id>
   API_URL=<your-railway-url>
   WEB_URL=<your-vercel-url>
   CORS_ORIGIN=<your-vercel-url>
   ```

5. **Add Start Command**
   ```bash
   cd apps/api && pnpm install && pnpm prisma:generate && pnpm build && pnpm start
   ```

6. **Deploy!**
   - Railway will auto-deploy on push
   - Get your API URL from Railway dashboard

### Frontend (Vercel)

1. **Sign up at [Vercel](https://vercel.com/)**

2. **Import Repository**
   - Connect GitHub
   - Select repository

3. **Configure Build**
   - Framework: Next.js
   - Root Directory: `apps/web`
   - Build Command: `cd ../.. && pnpm install && cd apps/web && pnpm build`
   - Output Directory: `.next`

4. **Set Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=<your-railway-api-url>
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-key>
   ```

5. **Deploy!**
   - Vercel will auto-deploy on push

### Configure Stripe Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-api-url/api/subscription/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy webhook secret to Railway env vars

---

## 📦 Option 2: AWS Full Stack

### Architecture

```
CloudFront → S3 (Frontend)
    ↓
ALB → ECS (Backend) → RDS/DocumentDB
```

### Backend (ECS)

1. **Create ECR Repository**
   ```bash
   aws ecr create-repository --repository-name quizflow-api
   ```

2. **Build and Push Docker Image**
   ```bash
   cd apps/api
   docker build -t quizflow-api .
   docker tag quizflow-api:latest <ecr-url>/quizflow-api:latest
   docker push <ecr-url>/quizflow-api:latest
   ```

3. **Create ECS Cluster**
   ```bash
   aws ecs create-cluster --cluster-name quizflow-cluster
   ```

4. **Create Task Definition**
   - See `deployment/aws/task-definition.json`
   - Add environment variables
   - Set secrets in AWS Secrets Manager

5. **Create Service**
   ```bash
   aws ecs create-service \
     --cluster quizflow-cluster \
     --service-name quizflow-api \
     --task-definition quizflow-api \
     --desired-count 2 \
     --launch-type FARGATE
   ```

### Frontend (S3 + CloudFront)

1. **Build Frontend**
   ```bash
   cd apps/web
   pnpm build
   pnpm export
   ```

2. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://quizflow-frontend
   ```

3. **Upload Files**
   ```bash
   aws s3 sync out/ s3://quizflow-frontend
   ```

4. **Create CloudFront Distribution**
   - Origin: S3 bucket
   - Enable HTTPS
   - Add custom domain

### Database (DocumentDB)

1. **Create Cluster**
   ```bash
   aws docdb create-db-cluster \
     --db-cluster-identifier quizflow-db \
     --engine docdb \
     --master-username admin \
     --master-user-password <password>
   ```

2. **Update CONNECTION_STRING**

---

## 📦 Option 3: DigitalOcean

### App Platform

1. **Create App**
   - Connect GitHub
   - Select repository

2. **Configure Services**

   **Backend:**
   - Type: Web Service
   - Source: `apps/api`
   - Build Command: `pnpm install && pnpm build`
   - Run Command: `pnpm start`
   - Port: 5000

   **Frontend:**
   - Type: Static Site
   - Source: `apps/web`
   - Build Command: `pnpm install && pnpm build`
   - Output Directory: `.next`

3. **Add MongoDB**
   - Create Managed Database
   - Add to environment variables

4. **Deploy!**

---

## 🐳 Option 4: Docker Compose

### Production docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    networks:
      - app-network

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    restart: always
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      DATABASE_URL: mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/quizflow?authSource=admin
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
    depends_on:
      - mongodb
    networks:
      - app-network

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    restart: always
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://api:5000
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
    depends_on:
      - web
      - api
    networks:
      - app-network

volumes:
  mongodb_data:

networks:
  app-network:
    driver: bridge
```

### Deploy to Any VPS

```bash
# 1. Clone repository
git clone <repo-url>
cd quizflow-ai

# 2. Create .env file
cat > .env << EOF
MONGO_PASSWORD=secure-password
JWT_ACCESS_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_...
EOF

# 3. Start services
docker-compose up -d

# 4. View logs
docker-compose logs -f
```

---

## 🔧 Post-Deployment Checklist

### Security

- [ ] Change all default passwords
- [ ] Use secrets manager (not env files)
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use production MongoDB URI

### Monitoring

- [ ] Set up error tracking (Sentry)
- [ ] Configure logging (CloudWatch/Logtail)
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Add performance monitoring (New Relic)
- [ ] Configure alerts

### Performance

- [ ] Enable CDN (CloudFront/Cloudflare)
- [ ] Configure caching headers
- [ ] Optimize images
- [ ] Enable compression
- [ ] Use connection pooling

### Backup

- [ ] Automated database backups
- [ ] S3 file backups
- [ ] Disaster recovery plan

---

## 📊 Monitoring Setup

### Error Tracking (Sentry)

```typescript
// apps/api/src/server.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

app.use(Sentry.Handlers.errorHandler());
```

### Logging (Winston → CloudWatch)

```typescript
import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';

const logger = winston.createLogger({
  transports: [
    new WinstonCloudWatch({
      logGroupName: '/aws/ecs/quizflow-api',
      logStreamName: `${process.env.HOSTNAME}-${Date.now()}`,
      awsRegion: 'us-east-1',
    }),
  ],
});
```

### Uptime Monitoring

- Use [UptimeRobot](https://uptimerobot.com/)
- Monitor: `/health` endpoint
- Alert on downtime

---

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```
   Solution: Check DATABASE_URL, firewall rules, and IP whitelist
   ```

2. **CORS Errors**
   ```
   Solution: Add frontend URL to CORS_ORIGIN env var
   ```

3. **Stripe Webhooks Not Working**
   ```
   Solution: Verify webhook secret, check endpoint URL
   ```

4. **File Uploads Fail**
   ```
   Solution: Check MAX_FILE_SIZE, disk space, and permissions
   ```

5. **Build Failures**
   ```
   Solution: Clear node_modules, reinstall dependencies
   ```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm --filter @quizflow/api test
      - run: pnpm --filter @quizflow/web build

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          curl -X POST ${{ secrets.RAILWAY_WEBHOOK_URL }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 📈 Scaling Strategy

### Vertical Scaling (Easier)
- Increase server resources
- Good for up to ~10K users

### Horizontal Scaling (Better)
```
Load Balancer
    ├── API Server 1
    ├── API Server 2
    └── API Server 3
         ↓
    MongoDB Cluster
```

**Requirements:**
- Stateless services (✅ we use JWT)
- Shared database (✅ MongoDB)
- Shared file storage (use S3 instead of local disk)

---

## 💰 Cost Estimates

### Small Scale (< 1K users)
- **Vercel**: Free (hobby plan)
- **Railway**: $5-20/month
- **MongoDB Atlas**: Free (M0 cluster)
- **Total**: ~$20/month

### Medium Scale (1K-10K users)
- **Vercel**: $20/month (pro plan)
- **Railway**: $50-100/month
- **MongoDB Atlas**: $57/month (M10 cluster)
- **Total**: ~$150/month

### Large Scale (10K+ users)
- **AWS/GCP**: $500-2000/month
- Consider reserved instances
- Negotiate enterprise pricing

---

## ✅ Launch Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] Security audit complete
- [ ] Performance optimized
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Domain configured
- [ ] SSL certificate installed
- [ ] Error tracking active
- [ ] Documentation complete

### Launch Day
- [ ] Deploy to production
- [ ] Smoke test all features
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify payments work
- [ ] Test email notifications

### Post-Launch
- [ ] Monitor for 24 hours
- [ ] Fix critical bugs
- [ ] Gather user feedback
- [ ] Plan next features

---

**Need Help?** Check logs first, then search error messages. Most issues are configuration-related! 🔧

