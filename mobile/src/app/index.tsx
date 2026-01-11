import { useEffect, useState, useCallback } from "react";
import { router, useRootNavigationState } from "expo-router";
import { ScreenWrapper } from "@/shared/components/ui";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";

export default function Index() {
  const { isReady, isAuthenticated } = useAuthSession();
  const rootNavigationState = useRootNavigationState();
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  // Callback when navigator is ready
  const onNavigationStateChange = useCallback(() => {
    if (rootNavigationState?.key != null) {
      setIsLayoutReady(true);
    }
  }, [rootNavigationState?.key]);

  useEffect(() => {
    onNavigationStateChange();
  }, [onNavigationStateChange]);

  useEffect(() => {
    // Only navigate when:
    // 1. Layout is ready
    // 2. Auth is fully loaded (Clerk + backend sync complete)
    if (!isLayoutReady || !isReady) return;

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace("/(tool)/home");
      } else {
        router.replace("/(auth)/login");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isLayoutReady, isReady, isAuthenticated]);

  return <ScreenWrapper loading centered />;
}
