import React from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Button, ScreenWrapper, Text } from "@/shared/components/ui";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { storage } from "@/shared/utils";
import { authenticatedApiCall } from "@/shared/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import type { User } from "@/features/auth/types/auth.types";

const HomeScreen = () => {
  const { logout } = useAuthSession();
  const { getToken } = useAuth();
  const login = useAuthStore((state) => state.login);

  const handleLogout = async () => {
    try {
      // Clear all storage first
      storage.clearAll();
      // Then logout from Clerk
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleRefreshUser = async () => {
    try {
      console.log("Refreshing user data...");
      const userData = await authenticatedApiCall<User>("get", "/users/me", getToken);
      console.log("Fresh user data:", JSON.stringify(userData, null, 2));
      console.log("onboardingStatus value:", userData.onboardingStatus);
      console.log("onboardingStatus type:", typeof userData.onboardingStatus);

      login(userData);

      // Redirect based on onboarding status
      if (userData.onboardingStatus === 'NAME' || userData.onboardingStatus === 'BLOCKS') {
        console.log("Redirecting to onboarding...");
        router.replace("/(onboarding)");
      } else {
        alert(`Onboarding status: ${userData.onboardingStatus} (already complete)`);
      }
    } catch (error) {
      console.error("Refresh error:", error);
      alert("Failed to refresh user data");
    }
  };

  return (
    <ScreenWrapper centered={{ y: true, x: true }}>
      <Text variant="h1">Home</Text>
      <View style={{ gap: 12, marginTop: 20 }}>
        <Button onPress={handleRefreshUser}>
          Refresh User Data
        </Button>
        <Button onPress={handleLogout}>
          Logout
        </Button>
      </View>
    </ScreenWrapper>
  );
};

export default HomeScreen;
