import { useEffect, useCallback, useRef } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "@/constants";
import { authApi } from "../services/auth.service";
import { useAuthStore, selectIsAuthenticated } from "../stores/auth.store";
import type { User } from "../types/auth.types";

export interface AuthSession {
  // Unified state
  isReady: boolean;
  isAuthenticated: boolean;
  user: User | null;

  // Loading states
  isClerkLoaded: boolean;
  isBackendSyncing: boolean;

  // Actions
  syncWithBackend: () => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Unified auth hook that combines Clerk and backend authentication.
 * A user is only considered "authenticated" when:
 * 1. Clerk session is active AND
 * 2. User is synced with our backend (has user data in authStore)
 */
export function useAuthSession(): AuthSession {
  const syncingRef = useRef(false);

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
  const setLoading = useAuthStore((state) => state.setLoading);

  /**
   * Sync Clerk session with backend
   * Exchanges Clerk token for internal tokens
   */
  const syncWithBackend = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      setLoading(true);

      const clerkToken = await getToken();

      if (!clerkToken) {
        throw new Error("No Clerk token available");
      }

      // Exchange Clerk token for backend tokens
      const response = await authApi.verifyClerkToken(clerkToken);

      // Save to auth store
      login(response.user, response.accessToken);

      // Save refresh token (if provided)
      if (response.refreshToken) {
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      }
    } catch (error) {
      console.error("Backend sync failed:", error);
      // If sync fails, sign out of Clerk too
      await signOut();
      storeLogout();
    } finally {
      setLoading(false);
      syncingRef.current = false;
    }
  }, [getToken, login, setLoading, signOut, storeLogout]);

  /**
   * Full logout - clears both Clerk and backend session
   */
  const logout = useCallback(async () => {
    try {
      // Try to logout from backend
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        try {
          await authApi.logout(refreshToken);
        } catch {
          // Continue even if backend logout fails
        }
      }

      // Clear local storage
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);

      // Clear store
      storeLogout();

      // Sign out of Clerk
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
      // Force clear everything anyway
      storeLogout();
      await signOut();
    }
  }, [signOut, storeLogout]);

  /**
   * Auto-sync when Clerk is signed in but backend is not synced
   */
  useEffect(() => {
    const shouldSync =
      isClerkLoaded &&
      isClerkSignedIn &&
      !isBackendAuthenticated &&
      !isStoreLoading &&
      !syncingRef.current;

    if (shouldSync) {
      syncWithBackend();
    }
  }, [isClerkLoaded, isClerkSignedIn, isBackendAuthenticated, isStoreLoading, syncWithBackend]);

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
  const isBackendSyncing = isStoreLoading;

  return {
    isReady,
    isAuthenticated,
    user,
    isClerkLoaded,
    isBackendSyncing,
    syncWithBackend,
    logout,
  };
}
