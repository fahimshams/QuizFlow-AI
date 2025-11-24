# Admin Dashboard Guide 📊

## Overview

The Admin Dashboard provides comprehensive analytics and cost tracking for your QuizFlow AI SaaS product. Only users with the `ADMIN` role can access this dashboard.

## Access

1. **Create an Admin User** (if you haven't already):
   ```bash
   cd apps/api
   pnpm prisma:seed
   ```

   This creates an admin account:
   - **Email**: `admin@quizflow.ai`
   - **Password**: `Admin123!`

2. **Login** with the admin credentials

3. **Access Dashboard**:
   - Click on your user menu in the navbar
   - Select "📊 Admin Dashboard"
   - Or navigate directly to `/admin`

## Features

### Key Metrics
- **Total Users**: Total registered users with growth percentage
- **Monthly Revenue**: Current monthly recurring revenue (MRR)
- **Monthly Costs**: Breakdown of OpenAI and Stripe costs
- **Net Profit**: Revenue minus costs with profit margin

### User Statistics
- Free vs Pro users
- Active users (last 30 days)
- Churn rate

### Usage Statistics
- Total quizzes generated
- Quizzes generated this month
- Total file uploads
- Average questions per quiz

### Cost Breakdown
- **OpenAI API Costs**: Estimated based on quiz generations
  - Uses GPT-4o-mini pricing: ~$0.15/1M input tokens, $0.60/1M output tokens
  - Average quiz uses ~2000 input tokens and ~1500 output tokens
- **Stripe Fees**: 2.9% + $0.30 per transaction
- **Total Monthly Cost**: Sum of all costs

### Trend Charts
- **User Growth**: Last 30 days of new user registrations
- **Quiz Generation**: Last 30 days of quiz creations

## API Endpoint

The dashboard fetches data from:
```
GET /api/admin/analytics
```

**Authentication**: Requires ADMIN role

## Making a User Admin

To make an existing user an admin, you can:

1. **Using Prisma Studio**:
   ```bash
   cd apps/api
   pnpm prisma:studio
   ```
   - Find the user
   - Change `role` from `USER` to `ADMIN`

2. **Using MongoDB directly**:
   - Update the user document: `{ role: "ADMIN" }`

3. **Create a script** (recommended for production):
   ```typescript
   await prisma.user.update({
     where: { email: 'your-email@example.com' },
     data: { role: UserRole.ADMIN }
   });
   ```

## Cost Calculations

### OpenAI Costs
- Based on actual API usage
- Calculated per quiz generation
- Uses current GPT-4o-mini pricing

### Stripe Fees
- 2.9% of transaction amount
- $0.30 fixed fee per transaction
- Calculated based on active subscriptions

### Revenue
- Currently estimated based on active Pro subscriptions
- Assumes $10/month per Pro user (update `PRO_MONTHLY_PRICE` in `analytics.service.ts` with your actual Stripe price)
- For accurate revenue, integrate with Stripe API

## Notes

- Cost estimates are based on current pricing and may vary
- Revenue is estimated - integrate with Stripe API for accurate data
- Data refreshes automatically every 60 seconds
- All costs are in USD

## Future Enhancements

- Real-time Stripe revenue integration
- More detailed cost breakdowns
- Export analytics data
- Custom date range selection
- Email reports
- User activity logs

