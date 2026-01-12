# Clerk Authentication Simplification - Design Document

**Date:** 2026-01-12
**Status:** Approved
**Author:** Design Session with User

## Problem Statement

The current authentication system has two conflicting approaches:
1. Mobile obtains Clerk token (OAuth) ✅
2. Exchanges for internal JWT tokens (`accessToken` + `refreshToken`) ✅
3. Backend `ClerkAuthGuard` expects Clerk tokens directly ❌

This creates confusion, authentication errors, and unnecessary complexity with dual token systems.

## Solution: Use Clerk as Single Source of Truth

Simplify to use **only Clerk tokens** throughout the entire flow. Eliminate internal JWT generation, refresh token management, and token exchange.

---

## Architecture Overview

### Components
- **Clerk**: Handles signup, login, OAuth, tokens, expiration, refresh
- **Mobile**: Uses `@clerk/clerk-expo` for authentication
- **Backend**: Validates Clerk tokens and manages user data

### Simplified Flow

```
1. Mobile → Clerk: signup/login
2. Clerk → Mobile: session token
3. Mobile → Backend: request with "Bearer {clerk_token}"
4. Backend → Clerk API: validates token
5. Backend → DB: find/create user (auto-create on first request)
6. Backend → Mobile: response with data
```

### What We REMOVE
- ❌ Endpoint `/auth/clerk` (token exchange)
- ❌ Internal JWT generation (`accessToken`)
- ❌ Internal refresh tokens in DB
- ❌ Table `refresh_tokens`
- ❌ Endpoint `/auth/refresh`
- ❌ Endpoint `/auth/logout`
- ❌ Refresh interceptor in mobile
- ❌ SecureStore usage for tokens
- ❌ `auth.service.ts` methods (verifyClerkToken, generateTokens, refresh)
- ❌ `auth.controller.ts` endpoints
- ❌ JWT strategy and guards

### What We KEEP
- ✅ `ClerkAuthGuard` (improved with auto-create)
- ✅ `users` table with `clerkId` field
- ✅ Endpoint `/users/me`
- ✅ Clerk SDK handles all token lifecycle

---

## Onboarding Status Management

### Overview

Onboarding status is now managed **server-side** to prevent client-side logic errors and provide a single source of truth. The backend determines what onboarding steps are missing based on user data.

### OnboardingStatus Enum

**Location:** `backend/prisma/schema.prisma`

```prisma
enum OnboardingStatus {
  NAME      // Missing firstName
  BLOCKS    // No blocks created yet (minimum 1 required)
  COMPLETE  // All required steps done
}
```

**Note:** Loops and Reminders are optional with defaults, so they're not blocking states.

### User Model Update

```prisma
model User {
  // ... existing fields

  onboardingStatus OnboardingStatus @default(NAME) @map("onboarding_status")
}
```

### Logic Flow

**On user auto-create (in ClerkAuthGuard):**
```typescript
user = await this.prisma.user.create({
  data: {
    // ... other fields
    onboardingStatus: 'NAME', // Always starts here
  },
});
```

**When `/users/me` is called:**
```typescript
async getMe(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: { blocks: true }, // Need to check blocks
  });

  // Determine current onboarding status
  let status: OnboardingStatus = 'COMPLETE';

  if (!user.firstName || user.firstName.trim() === '') {
    status = 'NAME';
  } else if (user.blocks.length === 0) {
    status = 'BLOCKS';
  }

  // Update if changed
  if (status !== user.onboardingStatus) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingStatus: status },
    });
  }

  return {
    ...user,
    onboardingStatus: status,
  };
}
```

**When onboarding endpoint is called:**
```typescript
@Post('onboarding/complete')
async completeOnboarding(@CurrentUser() user, @Body() dto: CompleteOnboardingDto) {
  // 1. Update user firstName
  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: dto.firstName,
      // ... other settings
    },
  });

  // 2. Create blocks
  await this.prisma.block.createMany({
    data: dto.defaultBlocks.map(b => ({
      ...b,
      userId: user.id,
    })),
  });

  // 3. Update status to COMPLETE
  await this.prisma.user.update({
    where: { id: user.id },
    data: { onboardingStatus: 'COMPLETE' },
  });

  return { success: true };
}
```

### Mobile Integration

**On app start / after login:**
```typescript
const { user } = useAuthSession();

useEffect(() => {
  if (user) {
    switch (user.onboardingStatus) {
      case 'NAME':
      case 'BLOCKS':
        router.replace('/(onboarding)');
        break;
      case 'COMPLETE':
        router.replace('/(tool)/home');
        break;
    }
  }
}, [user?.onboardingStatus]);
```

**In onboarding wizard:**
```typescript
// Wizard can start from the appropriate step based on status
const initialStep = user.onboardingStatus === 'NAME' ? 0 : 1;
```

### Benefits

- ✅ Single source of truth (backend)
- ✅ No client-side logic errors
- ✅ Can resume onboarding from correct step
- ✅ Scalable (easy to add new states)
- ✅ Backend validates all requirements

---

## Backend Design

### 1. ClerkAuthGuard (Enhanced)

**Location:** `backend/src/modules/auth/guards/clerk-auth.guard.ts`

**Responsibilities:**
1. Extract Clerk token from `Authorization: Bearer {token}` header
2. Validate token with Clerk API using `authenticateRequest()`
3. Search for user in DB by `clerkId`
4. **Auto-create user** if not found (first request after signup)
5. Attach user to request for controller access

**Key Logic:**
```typescript
// 1. Validate with Clerk
const { isAuthenticated, toAuth } = await this.clerkClient.authenticateRequest(request, {
  jwtKey: this.configService.get('clerk.jwtKey'),
});

// 2. Get clerkId
const clerkId = toAuth().userId;

// 3. Find or create user
let user = await this.prisma.user.findUnique({ where: { clerkId } });

if (!user) {
  // Auto-create on first request
  const clerkUser = await this.clerkClient.users.getUser(clerkId);
  user = await this.prisma.user.create({
    data: {
      clerkId,
      email: clerkUser.emailAddresses[0].emailAddress,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      avatarUrl: clerkUser.imageUrl,
      emailVerified: clerkUser.emailAddresses[0].verification.status === 'verified',
    },
  });
}

// 4. Attach to request
request.user = { id: user.id, email: user.email, role: user.role, ... };
```

### 2. Users Controller

**Endpoint:** `GET /users/me`

**Implementation:**
```typescript
@Get('me')
getMe(@CurrentUser() user: User) {
  return user; // Already attached by guard
}
```

No additional DB queries needed - guard provides all data.

### 3. Database Migration

**Remove table:**
```sql
DROP TABLE refresh_tokens;
```

**Keep table:**
```sql
-- users table remains unchanged
-- clerkId field is crucial for mapping
```

### 4. Files to DELETE

```
backend/src/modules/auth/
  ❌ auth.controller.ts
  ❌ auth.service.ts
  ❌ dto/auth.dto.ts
  ❌ strategies/jwt.strategy.ts (if exists)
  ❌ guards/jwt-auth.guard.ts (if exists)
```

### 5. Files to MODIFY

```
✅ guards/clerk-auth.guard.ts (add auto-create logic)
✅ auth.module.ts (simplify imports, remove JwtModule)
✅ app.module.ts (ensure ClerkAuthGuard is APP_GUARD)
```

---

## Mobile Design

### 1. Authentication Hook (Simplified)

**Location:** `mobile/src/features/auth/hooks/useAuthSession.ts`

**Old complexity:**
- Synced with backend
- Managed token storage
- Handled refresh logic
- Multiple loading states

**New simplicity:**
```typescript
export function useAuthSession() {
  const { isLoaded, isSignedIn, user: clerkUser, signOut } = useClerkAuth();
  const { user, setUser, clearUser } = useAuthStore();

  // Load user data from backend once after Clerk login
  useEffect(() => {
    if (isLoaded && isSignedIn && !user) {
      loadUserData();
    }
  }, [isLoaded, isSignedIn]);

  const loadUserData = async () => {
    const userData = await api.get('/users/me');
    setUser(userData);
  };

  return {
    isReady: isLoaded,
    isAuthenticated: isSignedIn && !!user,
    user,
    logout: async () => {
      await signOut();
      clearUser();
    },
  };
}
```

### 2. API Client (Simplified)

**Location:** `mobile/src/shared/lib/api.ts`

**Request Interceptor:**
```typescript
api.interceptors.request.use(async (config) => {
  const { getToken } = useAuth(); // Clerk hook
  const token = await getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
```

**Response Interceptor:**
```typescript
api.interceptors.response.use(
  response => response,
  async (error) => {
    // Only handle auth errors
    if (error.response?.status === 401) {
      // Clerk already tried refresh
      // If we're here, token is truly invalid
      await signOut();
      router.replace('/login');
    }
    return Promise.reject(error);
  }
);
```

### 3. Storage Strategy

**MMKV Usage:**
```typescript
// Optional: cache user data for faster app start
MMKV.set('user', JSON.stringify(user));

// On app start
const cachedUser = MMKV.getString('user');
if (cachedUser) {
  setUser(JSON.parse(cachedUser)); // Immediate UI
}
```

**What NOT to store:**
- ❌ Tokens (Clerk SDK handles internally)
- ❌ Session data (Clerk manages)

**What's optional to store:**
- ✅ User data (for faster UX, will revalidate on next request)

### 4. Files to DELETE

```
mobile/src/features/auth/
  ❌ services/auth.service.ts (login, register, verifyClerkToken, refresh)
```

### 5. Files to MODIFY

```
✅ hooks/useAuthSession.ts (major simplification)
✅ stores/auth.store.ts (optional, just for user cache)
✅ shared/lib/api.ts (simplified interceptors)
```

### 6. Remove from Constants

```typescript
// BEFORE
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',    // ❌ DELETE
  REFRESH_TOKEN: 'refresh_token',  // ❌ DELETE
  USER: 'user',                     // ✅ KEEP (optional)
};

// AFTER
export const STORAGE_KEYS = {
  USER: 'user', // Optional: for caching only
};
```

---

## Security Considerations

### Why This Is More Secure

**Previous approach (less secure):**
- ❌ Tokens stored in SecureStore (persistent, extractable)
- ❌ 7-day refresh tokens stored locally
- ❌ Manual refresh logic (potential bugs)
- ❌ Multiple token types to manage

**New approach (more secure):**
- ✅ Tokens only in memory (Clerk SDK)
- ✅ Short expiration (~1 hour) + auto-refresh
- ✅ HTTPS encrypts all token transmission
- ✅ Industry-standard OAuth 2.0 pattern
- ✅ Clerk handles all security updates
- ✅ No persistent tokens on device

### Token Transmission Safety

**Q: Is it safe to send tokens in every request?**

**A: Yes, completely safe.**

1. **HTTPS encryption** - All traffic is encrypted, tokens cannot be intercepted
2. **Standard practice** - How Google, Facebook, Auth0, Firebase, Supabase work
3. **Short-lived tokens** - Clerk tokens expire quickly, auto-rotate
4. **No storage risk** - Not persisted on device, can't be extracted
5. **Automatic refresh** - Clerk SDK handles transparently

---

## Error Handling

### Scenario 1: Invalid/Expired Clerk Token

```
Flow:
1. Backend → 401 Unauthorized
2. Mobile → Clerk SDK detects, attempts auto-refresh
3. If refresh succeeds → retry original request
4. If refresh fails → signOut() → redirect to login
```

### Scenario 2: User Account Inactive

```
Flow:
1. Guard validates token ✅
2. Guard checks user.isActive = false
3. Backend → 401 "Account is inactive"
4. Mobile → show message, logout
```

### Scenario 3: User Deleted from Clerk

```
Flow:
1. Token validation fails → 401
2. Mobile → automatic logout
3. Optional: Clerk webhook cleans up DB
```

### Scenario 4: Network Error

```
Flow:
1. Request fails → network error
2. Mobile → show "No connection" message
3. NO logout (token still valid)
4. User can retry when online
```

### Scenario 5: First-Time User (Auto-Create)

```
Flow:
1. New user signs up in Clerk
2. First request to backend
3. Guard validates token ✅
4. Guard finds no user in DB
5. Guard fetches data from Clerk API
6. Guard creates user in DB
7. Request continues normally
```

---

## Migration Plan

### Phase 1: Backend Cleanup

**Step 1.1: Database Migration**
```bash
cd backend
npx prisma migrate dev --name auth_simplification_and_onboarding
```

**Migration includes:**
```prisma
-- 1. Drop refresh_tokens table
DROP TABLE refresh_tokens;

-- 2. Add onboarding_status enum
CREATE TYPE "OnboardingStatus" AS ENUM ('NAME', 'BLOCKS', 'COMPLETE');

-- 3. Add onboarding_status column to users
ALTER TABLE users ADD COLUMN onboarding_status "OnboardingStatus" NOT NULL DEFAULT 'NAME';
```

**Step 1.2: Delete Auth Files**
```bash
rm backend/src/modules/auth/auth.controller.ts
rm backend/src/modules/auth/auth.service.ts
rm backend/src/modules/auth/dto/auth.dto.ts
rm -rf backend/src/modules/auth/strategies/
```

**Step 1.3: Update ClerkAuthGuard**
- Add auto-create user logic
- Fetch user data from Clerk on first request
- Create user in DB with `onboardingStatus: 'NAME'` as default

**Step 1.4: Update UsersService (/users/me)**
- Add logic to calculate onboardingStatus based on data
- Check if firstName is empty → 'NAME'
- Check if blocks.length === 0 → 'BLOCKS'
- Otherwise → 'COMPLETE'
- Update user record if status changed

**Step 1.5: Update auth.module.ts**
- Remove JwtModule import
- Remove AuthService provider
- Keep only ClerkAuthGuard

**Step 1.6: Verify APP_GUARD**
- Ensure ClerkAuthGuard is registered globally
- Keep @Public() decorator working

### Phase 2: Mobile Simplification

**Step 2.1: Remove SecureStore**
```bash
# Find all SecureStore imports
grep -r "expo-secure-store" mobile/src/

# Remove imports and usages
```

**Step 2.2: Simplify api.ts**
- Update request interceptor (use Clerk's getToken())
- Simplify response interceptor (remove refresh logic)
- Keep only 401 → logout logic

**Step 2.3: Rewrite useAuthSession**
- Remove syncWithBackend logic
- Remove token management
- Add simple loadUserData() call
- Use Clerk's useAuth() directly

**Step 2.4: Update auth.store.ts**
- Keep only user state
- Remove token state
- Optional: add MMKV persistence

**Step 2.5: Delete auth.service.ts**
```bash
rm mobile/src/features/auth/services/auth.service.ts
```

**Step 2.6: Update Constants**
```typescript
// Remove token keys from STORAGE_KEYS
```

### Phase 3: Testing

**Test 3.1: New User Signup**
1. Sign up with Clerk
2. Make first API request
3. Verify user auto-created in DB
4. Verify subsequent requests use existing user

**Test 3.2: Existing User Login**
1. Login with existing Clerk account
2. Make API request
3. Verify user loaded from DB
4. Verify all data correct

**Test 3.3: Logout Flow**
1. Logout in mobile
2. Verify Clerk session cleared
3. Verify app redirects to login
4. Verify subsequent requests fail with 401

**Test 3.4: Token Expiration**
1. Wait for token expiration (~1 hour)
2. Make API request
3. Verify Clerk auto-refreshes
4. Verify request succeeds

**Test 3.5: Invalid Token**
1. Manually invalidate Clerk session
2. Make API request
3. Verify 401 error
4. Verify automatic logout

**Test 3.6: Onboarding Status - New User**
1. Sign up new user
2. Call /users/me
3. Verify `onboardingStatus: 'NAME'`
4. Verify redirect to onboarding in mobile

**Test 3.7: Onboarding Status - Complete Flow**
1. New user with `onboardingStatus: 'NAME'`
2. Complete onboarding (add firstName + blocks)
3. Call /users/me
4. Verify `onboardingStatus: 'COMPLETE'`
5. Verify redirect to home in mobile

**Test 3.8: Onboarding Status - Partial Data**
1. Create user with firstName but no blocks
2. Call /users/me
3. Verify `onboardingStatus: 'BLOCKS'`
4. Verify can resume from blocks step

---

## Success Criteria

### Functional Requirements
- ✅ Users can sign up/login with Clerk (OAuth supported)
- ✅ First API request auto-creates user in DB with `onboardingStatus: 'NAME'`
- ✅ Subsequent requests use existing user
- ✅ Token expiration handled automatically by Clerk
- ✅ Logout clears all session data
- ✅ 401 errors trigger automatic logout
- ✅ Onboarding status calculated by backend (NAME → BLOCKS → COMPLETE)
- ✅ Mobile redirects based on onboarding status
- ✅ Users can resume onboarding from correct step

### Non-Functional Requirements
- ✅ Simpler codebase (fewer files, less logic)
- ✅ No manual token management
- ✅ No SecureStore complexity
- ✅ Industry-standard OAuth 2.0 pattern
- ✅ Better security (no persistent tokens)
- ✅ Clerk handles updates/security patches

### Developer Experience
- ✅ Clear authentication flow
- ✅ Less code to maintain
- ✅ Fewer edge cases to handle
- ✅ Standard patterns (easy for new devs)

---

## Future Considerations

### Webhooks (Optional Enhancement)
Consider adding Clerk webhooks for:
- User created → pre-create in DB
- User updated → sync data
- User deleted → soft delete in DB

**Benefits:**
- User exists before first API call
- Automatic sync of profile changes
- Better data consistency

**Not required for MVP** - auto-create in guard is sufficient.

### Multi-tenancy
Current design supports organizations:
- `user.organizationId` field exists
- Guard can check organization membership
- Clerk supports organization features

### Rate Limiting
Consider adding rate limiting to guard:
- Protect against abuse
- Especially for auto-create logic

---

## Rollback Plan

If issues arise during migration:

**Backend:**
1. Revert database migration
2. Restore deleted auth files from git
3. Re-register old guards

**Mobile:**
1. Restore SecureStore code
2. Restore auth.service.ts
3. Restore old interceptors

**Risk:** Low - changes are well-isolated and testable.

---

## Conclusion

This design simplifies authentication by using Clerk as the single source of truth and moves onboarding logic to the backend. It eliminates dual token systems, reduces code complexity, improves security, and follows industry-standard patterns.

**Key Benefits:**
- 50% less authentication code
- No manual token management
- Better security
- Simpler mental model
- Clerk handles all edge cases
- Server-side onboarding status (single source of truth)
- Scalable onboarding flow (easy to add new steps)

**Implementation Effort:**
- Backend Auth: ~2-3 hours
- Backend Onboarding Status: ~1 hour
- Mobile Auth: ~2-3 hours
- Mobile Onboarding Integration: ~30 minutes
- Testing: ~1-2 hours
- **Total: ~7-8 hours**

---

## Appendix: Code Examples

### A. Enhanced ClerkAuthGuard (Pseudo-code)

```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  // 1. Skip public routes
  if (isPublic) return true;

  // 2. Extract and validate token
  const token = extractToken(request);
  const { isAuthenticated, toAuth } = await this.clerkClient.authenticateRequest(request, {
    jwtKey: this.configService.get('clerk.jwtKey'),
  });

  if (!isAuthenticated) throw new UnauthorizedException();

  // 3. Get clerkId
  const clerkId = toAuth().userId;

  // 4. Find or create user
  let user = await this.prisma.user.findUnique({ where: { clerkId } });

  if (!user) {
    // AUTO-CREATE on first request
    const clerkUser = await this.clerkClient.users.getUser(clerkId);
    user = await this.prisma.user.create({
      data: {
        clerkId,
        email: clerkUser.emailAddresses[0].emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        avatarUrl: clerkUser.imageUrl,
        emailVerified: clerkUser.emailAddresses[0].verification.status === 'verified',
      },
    });
  }

  // 5. Check active status
  if (!user.isActive) throw new UnauthorizedException('Account is inactive');

  // 6. Attach to request
  request.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    clerkId,
  };

  return true;
}
```

### B. Simplified Mobile Auth Hook

```typescript
export function useAuthSession() {
  const { isLoaded, isSignedIn, signOut } = useClerkAuth();
  const { user, setUser, clearUser } = useAuthStore();

  // Load user data once after Clerk authentication
  useEffect(() => {
    if (isLoaded && isSignedIn && !user) {
      loadUserData();
    }
  }, [isLoaded, isSignedIn]);

  const loadUserData = async () => {
    try {
      const response = await api.get('/users/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to load user:', error);
      await signOut();
    }
  };

  const logout = async () => {
    await signOut();
    clearUser();
  };

  return {
    isReady: isLoaded,
    isAuthenticated: isSignedIn && !!user,
    user,
    logout,
  };
}
```

### C. Simplified API Interceptors

```typescript
// REQUEST
api.interceptors.request.use(async (config) => {
  const { getToken } = useAuth();
  const token = await getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// RESPONSE
api.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token invalid, logout
      await signOut();
      router.replace('/login');
    }
    return Promise.reject(error);
  }
);
```

---

**Document End**
