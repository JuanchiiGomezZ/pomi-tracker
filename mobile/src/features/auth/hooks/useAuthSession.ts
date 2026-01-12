import { useEffect, useRef, useCallback } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-expo";
import { authenticatedApiCall } from "@/shared/lib/api";
import { useAuthStore, selectIsAuthenticated } from "../stores/auth.store";
import type { User } from "../types/auth.types";

export interface AuthSession {
  // Unified state
  isReady: boolean;
  isAuthenticated: boolean;
  user: User | null;

  // Loading states
  isClerkLoaded: boolean;

  // Actions
  logout: () => Promise<void>;
}

// Flag to prevent concurrent requests - persists across component re-renders
let isLoadingUserData = false;
let hasLoadedUserData = false;

/**
 * Simplified auth hook that uses Clerk as the single source of truth.
 * User data is loaded once from /users/me after Clerk login.
 */
export function useAuthSession(): AuthSession {
  // Clerk state
  const {
    isLoaded: isClerkLoaded,
    isSignedIn: isClerkSignedIn,
    signOut,
    getToken,
  } = useClerkAuth();

  // Backend/store state
  const user = useAuthStore((state) => state.user);
  const isBackendAuthenticated = useAuthStore(selectIsAuthenticated);
  const isStoreLoading = useAuthStore((state) => state.isLoading);
  const login = useAuthStore((state) => state.login);
  const storeLogout = useAuthStore((state) => state.logout);

  /**
   * Full logout - clears both Clerk and backend session
   */
  const logout = useCallback(async () => {
    try {
      // Clear store first
      storeLogout();

      // Reset loading flags so next login will fetch user data
      isLoadingUserData = false;
      hasLoadedUserData = false;

      // Sign out of Clerk (handles token cleanup internally)
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
      // Force clear everything anyway
      storeLogout();
      isLoadingUserData = false;
      hasLoadedUserData = false;
      await signOut();
    }
  }, [signOut, storeLogout]);

  /**
   * Auto-load user data when Clerk is signed in
   * Uses module-level flags to prevent concurrent requests
   */
  useEffect(() => {
    // Only load when Clerk is fully ready and user not already loaded
    if (
      isClerkLoaded &&
      isClerkSignedIn &&
      !isStoreLoading &&
      !user
    ) {
      // Prevent concurrent requests
      if (isLoadingUserData) {
        console.log("[useAuthSession] Already loading user data, skipping...");
        return;
      }

      // Prevent re-loading if already succeeded
      if (hasLoadedUserData) {
        console.log("[useAuthSession] User already loaded previously, skipping...");
        return;
      }

      const loadUser = async () => {
        isLoadingUserData = true;
        try {
          console.log("[useAuthSession] Loading user data...");
          const userData = await authenticatedApiCall<User>("get", "/users/me", getToken);
          login(userData);
          hasLoadedUserData = true;
          console.log("[useAuthSession] User data loaded successfully");
        } catch (error) {
          console.error("[useAuthSession] Failed to load user data:", error);
          isLoadingUserData = false; // Reset on error so we can retry
        }
      };

      loadUser();
    }

    // Reset flags when user signs out
    if (!isClerkSignedIn) {
      isLoadingUserData = false;
      hasLoadedUserData = false;
    }
  }, [isClerkLoaded, isClerkSignedIn, isStoreLoading, user, getToken, login]);

  /**
   * If Clerk is signed out, clear backend state too
   */
  useEffect(() => {
    if (isClerkLoaded && !isClerkSignedIn && isBackendAuthenticated) {
      storeLogout();
    }
  }, [isClerkLoaded, isClerkSignedIn, isBackendAuthenticated, storeLogout]);

  // Compute unified state
  const isReady = isClerkLoaded && !isStoreLoading;
  const isAuthenticated = isClerkSignedIn === true && isBackendAuthenticated;

  return {
    isReady,
    isAuthenticated,
    user,
    isClerkLoaded,
    logout,
  };
}
