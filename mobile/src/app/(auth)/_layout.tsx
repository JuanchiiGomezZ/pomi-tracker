import { useEffect } from "react";
import { router, Stack } from "expo-router";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";

export default function AuthLayout() {
  const { isReady, isAuthenticated } = useAuthSession();

  useEffect(() => {
    // Redirect to home if already fully authenticated (Clerk + backend)
    if (isReady && isAuthenticated) {
      router.replace("/(tool)/home");
    }
  }, [isReady, isAuthenticated]);

  if (!isReady) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="privacy" />
    </Stack>
  );
}
