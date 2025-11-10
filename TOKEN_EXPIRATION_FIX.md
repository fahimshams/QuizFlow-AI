# Token Expiration Handling - Implementation Guide

## Problem
Users were not being automatically logged out when their JWT tokens expired. They had to manually refresh the page to see the logged-out state, creating a poor UX where the UI showed them as logged in but API requests would fail.

## Solution
Implemented a comprehensive token expiration detection and handling system with multiple layers of protection:

### 1. **Proactive Token Checking (Request Interceptor)**
`apps/web/src/lib/axios.ts`

Before every API request, the axios interceptor now:
- Decodes the JWT token
- Checks if it's expired
- Immediately logs out the user if expired
- Prevents the failed API request from even being sent

```typescript
// Check token expiration BEFORE making request
const payload = JSON.parse(atob(token.split('.')[1]));
const isExpired = Date.now() >= payload.exp * 1000;

if (isExpired) {
  handleImmediateLogout();
  return Promise.reject(new Error('Token expired'));
}
```

### 2. **Periodic Background Monitoring**
`apps/web/src/hooks/useTokenExpiration.ts`

A custom React hook that runs in the background:
- Checks token expiration every 30 seconds
- Checks immediately on component mount
- Automatically logs out when expiration detected
- Works even when user is idle (not making API requests)

```typescript
// Check every 30 seconds
const interval = setInterval(checkTokenExpiration, 30000);
```

### 3. **Immediate Logout Function**
`apps/web/src/lib/auth.ts`

Centralized logout function that:
- Clears localStorage tokens
- Dispatches `auth-logout` event to notify all components
- Redirects to login page
- Avoids redirect loops for public pages

```typescript
export const logoutImmediately = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.dispatchEvent(new Event('auth-logout'));
  // Smart redirect logic...
}
```

### 4. **Component State Synchronization**
All components listen for the `auth-logout` event:
- **Navbar** - Updates UI to show logged-out state
- **Dashboard** - Redirects to login
- Any other authenticated components

## Integration Points

### Files Modified:
1. **`apps/web/src/lib/axios.ts`**
   - Added proactive token check in request interceptor
   - Simplified response interceptor using `handleImmediateLogout()`

2. **`apps/web/src/lib/auth.ts`**
   - Added `logoutImmediately()` function
   - Enhanced `isAuthenticated()` to trigger logout on expiration

3. **`apps/web/src/hooks/useTokenExpiration.ts`** (NEW)
   - Background monitoring hook
   - Runs every 30 seconds

4. **`apps/web/src/components/Navbar.tsx`**
   - Uses `useTokenExpiration()` hook

5. **`apps/web/src/app/dashboard/page.tsx`**
   - Uses `useTokenExpiration()` hook

## User Experience Improvements

### Before:
- ❌ Token expires silently
- ❌ UI shows user as logged in
- ❌ API requests fail with confusing errors
- ❌ User must manually refresh page
- ❌ No visual feedback

### After:
- ✅ Token expiration detected proactively
- ✅ User immediately logged out
- ✅ Automatic redirect to login page
- ✅ No failed API requests
- ✅ Consistent UI state across all components
- ✅ Works even when user is idle

## Testing
To test the implementation:

1. **Manual Token Expiration:**
   - Login to the app
   - Open browser DevTools > Application > Local Storage
   - Manually modify the JWT token to have an expired timestamp
   - Wait up to 30 seconds or make any API call
   - Should be automatically logged out and redirected

2. **Wait for Natural Expiration:**
   - Login to the app
   - Wait for token to naturally expire (typically 1 hour for access token)
   - Should be automatically logged out within 30 seconds

3. **API Request During Expiration:**
   - Token expires
   - Try to upload a file or generate a quiz
   - Should be logged out before the request is sent

## Technical Details

### Token Expiration Check Logic:
```typescript
const payload = JSON.parse(atob(token.split('.')[1]));
const expirationTime = payload.exp * 1000; // Convert to milliseconds
const isExpired = Date.now() >= expirationTime;
```

### Why Three Layers?
1. **Request Interceptor**: Catches expiration before API calls
2. **Background Monitor**: Catches expiration during idle time
3. **Auth Check**: Catches expiration on page load/navigation

This ensures the user is ALWAYS logged out immediately when their token expires, regardless of what they're doing.

## Future Enhancements
- Add a "session expiring soon" warning (e.g., 5 minutes before)
- Implement automatic silent token refresh using refresh token
- Add user activity tracking to extend session during active use
- Show a toast notification when logged out due to expiration

## Maintenance Notes
- The 30-second check interval can be adjusted in `useTokenExpiration.ts`
- JWT expiration is set on the backend in `apps/api/src/config/constants.ts`
- Access token typically expires in 1 hour
- Refresh token typically expires in 7 days

