# Authenticated User Redirect Protection

## Overview
Implemented automatic redirects for logged-in users to prevent them from accessing pages meant for unauthenticated users. This improves UX by ensuring users land on the appropriate page based on their authentication state.

## Changes Made

### 1. **Home Page (Landing Page)**
**File:** `apps/web/src/app/page.tsx`

**Change:** Added redirect logic to send authenticated users to the dashboard instead of showing them the marketing landing page.

```typescript
// Redirect authenticated users to dashboard
useEffect(() => {
  if (isAuthenticated()) {
    router.push('/dashboard');
  }
}, [router]);
```

**Why:** The home page is a marketing/promotional page designed to convince visitors to sign up. Logged-in users don't need to see this - they should go straight to their dashboard.

### 2. **Login Page**
**File:** `apps/web/src/app/login/page.tsx`

**Change:** Added redirect logic to send already-authenticated users to the dashboard.

```typescript
// Redirect if already logged in
useEffect(() => {
  if (isAuthenticated()) {
    router.push('/dashboard');
  }
}, [router]);
```

**Why:** If a user is already logged in and tries to access the login page (e.g., by clicking a bookmarked link), they shouldn't see the login form. They should be redirected to their dashboard.

### 3. **Register Page**
**File:** `apps/web/src/app/register/page.tsx`

**Change:** Added redirect logic to send already-authenticated users to the dashboard.

```typescript
// Redirect if already logged in
useEffect(() => {
  if (isAuthenticated()) {
    router.push('/dashboard');
  }
}, [router]);
```

**Why:** Similar to login - an already authenticated user shouldn't be able to access the registration page. They should be sent to their dashboard.

## User Experience Improvements

### Before:
- ❌ Logged-in users could see the home page marketing content
- ❌ Logged-in users could access login/register pages
- ❌ Confusing navigation flow
- ❌ Duplicate CTAs (e.g., "Get Started" when already using the app)

### After:
- ✅ Logged-in users automatically redirected to dashboard from home page
- ✅ Logged-in users automatically redirected to dashboard from login/register pages
- ✅ Clean, logical navigation flow
- ✅ Users always land on the appropriate page for their auth state
- ✅ No confusing duplicate CTAs or marketing content for existing users

## Navigation Flow

### Unauthenticated User:
1. Visits `/` → Sees landing page ✓
2. Visits `/login` → Sees login form ✓
3. Visits `/register` → Sees registration form ✓
4. Visits `/dashboard` → Redirected to `/login` ✓ (via Navbar logic)

### Authenticated User:
1. Visits `/` → **Redirected to `/dashboard`** ✓
2. Visits `/login` → **Redirected to `/dashboard`** ✓
3. Visits `/register` → **Redirected to `/dashboard`** ✓
4. Visits `/dashboard` → Sees dashboard ✓
5. Visits `/pricing` → Sees pricing (allowed, may want to upgrade) ✓

## Technical Details

All redirects use:
- `useEffect` hook to run on component mount
- `isAuthenticated()` from `@/lib/auth` to check auth state
- `router.push('/dashboard')` from Next.js navigation for client-side routing

The redirects happen:
- **Client-side** (in useEffect)
- **On mount** (dependency array includes only router)
- **Before render** (typically, due to React execution order)

## Related Pages

### Pages WITH Redirect (Auth users → Dashboard):
- ✅ `/` (Home)
- ✅ `/login`
- ✅ `/register`

### Pages WITHOUT Redirect (Allow auth users):
- ✅ `/pricing` - Users may want to see pricing to upgrade
- ✅ `/dashboard` - Main authenticated page
- ✅ `/upgrade` - Upgrade flow
- ✅ `/subscription` - Subscription management

## Testing Checklist

Test as **unauthenticated user**:
- [ ] Visit `/` → Should see landing page
- [ ] Visit `/login` → Should see login form
- [ ] Visit `/register` → Should see registration form
- [ ] Visit `/dashboard` → Should redirect to `/login`

Test as **authenticated user**:
- [ ] Visit `/` → Should redirect to `/dashboard`
- [ ] Visit `/login` → Should redirect to `/dashboard`
- [ ] Visit `/register` → Should redirect to `/dashboard`
- [ ] Visit `/dashboard` → Should see dashboard
- [ ] Visit `/pricing` → Should see pricing page

Test **navigation**:
- [ ] Login from login page → Should land on dashboard
- [ ] Register from register page → Should land on dashboard
- [ ] Logout from dashboard → Should land on home page
- [ ] Click logo while logged in → Should NOT see home page (redirect to dashboard)
- [ ] Click logo while logged out → Should see home page

## Benefits

1. **Cleaner UX**: Users don't see inappropriate content for their state
2. **Reduced Confusion**: No marketing CTAs for existing users
3. **Better Onboarding**: New users see marketing, existing users see app
4. **Logical Flow**: Users always land where they expect
5. **Professional**: Matches behavior of major SaaS applications

## Notes

- These redirects work in conjunction with the token expiration monitoring implemented earlier
- The redirect logic uses `isAuthenticated()` which checks token validity
- All redirects are client-side for optimal performance
- The home page was converted from server component to client component to enable redirect logic

