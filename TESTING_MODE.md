# Testing Mode - Subscription Flow Without Stripe

## 🧪 Overview

The subscription system is currently set up in **TEST MODE** - meaning you can test the complete upgrade/downgrade flow without connecting to Stripe API or needing API keys.

---

## ✅ What Works in Test Mode

### 1. **Upgrade to Pro**
- Navigate to `/upgrade` page
- Click "Upgrade to Pro Now"
- Instantly upgraded to Pro plan (no payment required)
- Redirected to dashboard with Pro features enabled

**Backend Endpoint:** `POST /subscription/upgrade-test`

### 2. **Downgrade to Free**
- Go to `/subscription` page (when Pro)
- Click "Cancel Subscription"
- Confirm in dialog
- Instantly downgraded to Free plan

**Backend Endpoint:** `POST /subscription/downgrade-test`

### 3. **Manage Billing (Simulated)**
- Go to `/subscription` page (when Pro)
- Click "💳 Manage Billing"
- Shows info alert about what would happen in production
- No actual Stripe portal opened

---

## 🔄 Complete Test Flow

### Starting as Free User:

1. **Login/Register**
   - Create account or login
   - Default plan: FREE

2. **Test Upload Limit**
   - Try to upload more than 5 files in a month
   - See upload limit dialog
   - Click "Upgrade to Pro"

3. **Upgrade Flow**
   - Redirected to `/upgrade` page
   - Review Pro features
   - Click "Upgrade to Pro Now"
   - 🎉 Instantly upgraded!
   - Redirected to dashboard

4. **Test Pro Features**
   - Unlimited uploads
   - Up to 30 questions per quiz
   - See "✨ PRO" badge in dashboard

5. **Manage Subscription**
   - Click user menu → "💳 Subscription"
   - View subscription details
   - Click "Manage Billing" (shows info alert)
   - Click "Cancel Subscription"

6. **Cancel Flow**
   - Confirmation dialog appears
   - Click "Yes, Cancel"
   - Instantly downgraded to FREE
   - Page refreshes showing Free plan

---

## 📁 Test Endpoints (Backend)

All test endpoints are in `apps/api/src/controllers/subscription.controller.ts`:

### Upgrade Test Endpoint
```typescript
POST /api/subscription/upgrade-test
Authorization: Bearer {accessToken}

// Response:
{
  "success": true,
  "message": "Successfully upgraded to Pro! 🎉",
  "data": {
    "plan": "PRO"
  }
}
```

### Downgrade Test Endpoint
```typescript
POST /api/subscription/downgrade-test
Authorization: Bearer {accessToken}

// Response:
{
  "success": true,
  "message": "Downgraded to Free plan",
  "data": {
    "plan": "FREE"
  }
}
```

---

## 🎨 Frontend Pages Modified for Test Mode

### 1. **Upgrade Page** (`apps/web/src/app/upgrade/page.tsx`)
```typescript
// TEST MODE: Uses upgrade-test endpoint
const handleUpgrade = async () => {
  const response = await api.post('/subscription/upgrade-test');
  // Instant upgrade, no Stripe checkout
};

// PRODUCTION CODE: Commented out
// const response = await api.post('/subscription/checkout', {...});
```

### 2. **Subscription Page** (`apps/web/src/app/subscription/page.tsx`)
```typescript
// TEST MODE: Uses downgrade-test endpoint
const handleCancelSubscription = async () => {
  const response = await api.post('/subscription/downgrade-test');
  // Instant downgrade
};

// Manage Billing: Shows alert instead of opening Stripe portal
const handleManageBilling = async () => {
  alert('TEST MODE - Would open Stripe portal in production');
};
```

### 3. **Pricing Page** (`apps/web/src/app/pricing/page.tsx`)
```typescript
// TEST MODE: Redirects to /upgrade page
const handleUpgradeToPro = async () => {
  window.location.href = '/upgrade';
};
```

---

## 🔄 Switching to Production Mode

When you're ready to connect to Stripe, follow these steps:

### Step 1: Get Stripe Keys
1. Sign up at [stripe.com](https://stripe.com)
2. Get your API keys from dashboard
3. Create a product and price in Stripe

### Step 2: Update Environment Variables
Add to `apps/api/.env`:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
STRIPE_PRO_PRICE_ID=price_test_...
```

### Step 3: Uncomment Production Code

**Upgrade Page:**
```typescript
// In apps/web/src/app/upgrade/page.tsx
// Uncomment the production code block and remove test mode code
```

**Subscription Page:**
```typescript
// In apps/web/src/app/subscription/page.tsx
// Uncomment production code for both handleManageBilling and handleCancelSubscription
```

**Pricing Page:**
```typescript
// In apps/web/src/app/pricing/page.tsx
// Uncomment production code in handleUpgradeToPro
```

### Step 4: Test with Stripe Test Cards
Use test card: `4242 4242 4242 4242` with any future expiry date

### Step 5: Remove Test Endpoints (Before Production)
Delete or comment out these endpoints in `apps/api/src/controllers/subscription.controller.ts`:
- `upgradeToProTest`
- `downgradeToFreeTest`

And their routes in `apps/api/src/routes/subscription.routes.ts`

---

## 📊 Test Scenarios to Try

### Scenario 1: Free User Journey
1. ✅ Register new account
2. ✅ Try to upload 6th file → See limit dialog
3. ✅ Click upgrade → Go to upgrade page
4. ✅ Upgrade to Pro → Instant upgrade
5. ✅ Upload unlimited files
6. ✅ Generate quiz with 30 questions
7. ✅ No watermark in quiz

### Scenario 2: Pro User Journey
1. ✅ Have Pro account
2. ✅ Go to subscription page
3. ✅ View Pro features
4. ✅ Click manage billing → See info
5. ✅ Cancel subscription
6. ✅ Confirm cancellation
7. ✅ Back to Free plan

### Scenario 3: Plan Features Testing
**Free Plan:**
- ✅ 5 uploads per month
- ✅ 5 questions per quiz
- ✅ Watermark in generated quizzes
- ✅ See "FREE" badge

**Pro Plan:**
- ✅ Unlimited uploads
- ✅ Up to 30 questions per quiz
- ✅ No watermark
- ✅ See "✨ PRO" badge

---

## 🎯 Current Status

### ✅ Working in Test Mode:
- Instant upgrade to Pro (no payment)
- Instant downgrade to Free
- Pro feature unlocking
- Plan-based upload limits
- Plan-based quiz limits
- Watermark control
- Dashboard test controls
- Subscription management UI

### 🔌 Not Connected Yet:
- Real Stripe API
- Payment processing
- Stripe webhooks
- Customer portal
- Invoice generation
- Payment method management

### 📝 TODO for Production:
- [ ] Add Stripe API keys
- [ ] Uncomment production code
- [ ] Test with Stripe test cards
- [ ] Set up webhook endpoint in Stripe
- [ ] Remove test endpoints
- [ ] Remove test controls from dashboard
- [ ] Configure Stripe customer portal
- [ ] Test full payment flow

---

## 🐛 Troubleshooting

### Issue: Can't upgrade to Pro
**Check:**
- Are you logged in?
- Is API server running?
- Check console for errors
- Verify `/subscription/upgrade-test` endpoint is accessible

### Issue: Can't see Pro features after upgrade
**Solution:**
- Refresh the page
- Check user plan in database
- Verify token is not expired
- Check dashboard test controls

### Issue: Upload limit not working
**Check:**
- User plan in database
- Usage records in database
- Check upload validation logic

---

## 💡 Benefits of Test Mode

1. **No Dependencies**: Test without Stripe account or API keys
2. **Instant Feedback**: No waiting for webhooks or payment processing
3. **Easy Debugging**: Direct API calls, no external factors
4. **Cost-Free**: No transaction fees during development
5. **Rapid Iteration**: Quick testing of UI/UX flows

---

## 🎓 Learning Resources

When ready to integrate Stripe:
- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Cards](https://stripe.com/docs/testing)

---

## ✨ Summary

You can now test the complete subscription flow without any Stripe integration:
- ✅ Upgrade to Pro (instant, no payment)
- ✅ Access Pro features
- ✅ Manage subscription
- ✅ Downgrade to Free
- ✅ Test all plan limits

When you're ready for production, simply uncomment the production code and add your Stripe keys! 🚀

