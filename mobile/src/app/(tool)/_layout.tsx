import { useEffect } from "react";
import { router, Tabs } from "expo-router";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";

export default function ToolLayout() {
  const { isReady, isAuthenticated } = useAuthSession();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (isReady && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isReady, isAuthenticated]);

  // Don't render protected screens if loading or not authenticated
  if (!isReady || !isAuthenticated) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
      }}
      initialRouteName="home"
    >
      <Tabs.Screen name="home" options={{}} />
    </Tabs>
  );
}
