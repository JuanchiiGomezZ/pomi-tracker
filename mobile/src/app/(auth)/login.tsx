import { StyleSheet } from "react-native-unistyles";
import { View, Pressable, Text, ActivityIndicator } from "react-native";
import { ScreenWrapper } from "@/shared/components/ui";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useOAuth, useSignInWithApple } from "@clerk/clerk-expo";
import { useState, useCallback } from "react";
import * as WebBrowser from "expo-web-browser";
import { useWarmUpBrowser } from "@/shared/hooks/useWarmUpBrowser";
import * as Linking from "expo-linking";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";

type OAuthProvider = "google" | "apple";

WebBrowser.maybeCompleteAuthSession();

interface SocialButtonProps {
  provider: "google" | "apple";
  onPress: () => void;
  isLoading: boolean;
}

function SocialButton({ provider, onPress, isLoading }: SocialButtonProps) {
  const { t } = useTranslation("auth");

  const isGoogle = provider === "google";
  const icon = isGoogle ? "G" : "";
  const title = isGoogle ? t("login.continue_with_google") : t("login.continue_with_apple");

  return (
    <Pressable
      style={({ pressed }) => [
        styles.socialButton,
        (pressed || isLoading) && styles.socialButtonPressed,
      ]}
      onPress={onPress}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.socialButtonContent}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#666" />
        ) : (
          <Text style={styles.socialIcon}>{icon}</Text>
        )}
        <Text style={styles.socialText}>{title}</Text>
      </View>
    </Pressable>
  );
}

export default function LoginScreen() {
  const { t } = useTranslation("auth");
  const [isLoading, setIsLoading] = useState<"google" | "apple" | null>(null);

  // Auth session hook - will auto-sync with backend after Clerk login
  useAuthSession();

  // Clerk OAuth hooks
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({
    strategy: "oauth_google",
  });
  const { startAppleAuthenticationFlow } = useSignInWithApple();

  useWarmUpBrowser();

  const handleOAuth = useCallback(
    async (provider: "google" | "apple") => {
      setIsLoading(provider);

      try {
        let createdSessionId: string | undefined;
        let setActiveCallback: ((params: { session: string }) => Promise<void>) | undefined;

        if (provider === "google") {
          const googleResult = await startGoogleOAuth({
            redirectUrl: Linking.createURL("/(tool)", { scheme: "pomitTracker" }),
          });

          createdSessionId = googleResult.createdSessionId;
          setActiveCallback = googleResult.setActive;
        } else if (provider === "apple") {
          const appleResult = await startAppleAuthenticationFlow();

          createdSessionId = appleResult.createdSessionId || undefined;
          setActiveCallback = appleResult.setActive;
        }

        if (createdSessionId && setActiveCallback) {
          // Set the session as active - useAuthSession will auto-sync with backend
          await setActiveCallback({ session: createdSessionId });
          // Navigation will happen automatically when isAuthenticated becomes true
        }
      } catch (error) {
        console.error(`${provider} login error:`, error);
      } finally {
        setIsLoading(null);
      }
    },
    [startGoogleOAuth, startAppleAuthenticationFlow]
  );

  return (
    <ScreenWrapper centered={{ y: true }} edges={["top", "bottom"]}>
      {/* Logo/Title */}
      <Text style={styles.title}>{t("login.app_name")}</Text>
      <Text style={styles.subtitle}>{t("login.subtitle")}</Text>

      {/* Social Login Buttons */}
      <View style={styles.buttonContainer}>
        <SocialButton
          provider="google"
          onPress={() => handleOAuth("google")}
          isLoading={isLoading === "google"}
        />
        <SocialButton
          provider="apple"
          onPress={() => handleOAuth("apple")}
          isLoading={isLoading === "apple"}
        />
      </View>

      {/* Terms */}
      <Text style={styles.terms}>
        {t("login.terms_prefix")}
        <Text style={styles.termsLink} onPress={() => router.push("/(auth)/terms")}>
          {t("login.terms_of_service")}
        </Text>
        <Text style={styles.terms}> {t("login.terms_and")} </Text>
        <Text style={styles.termsLink} onPress={() => router.push("/(auth)/privacy")}>
          {t("login.privacy_policy")}
        </Text>
      </Text>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create((theme) => ({
  title: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize["3xl"],
    color: theme.colors.text.primary,
    textAlign: "center",
    marginBottom: theme.spacing(2),
  },
  subtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: "center",
    marginBottom: theme.spacing(10),
  },
  buttonContainer: {
    width: "100%",
    gap: theme.spacing(3),
  },
  socialButton: {
    width: "100%",
    height: 56,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    justifyContent: "center",
  },
  socialButtonPressed: {
    backgroundColor: theme.colors.hover.background,
    borderColor: theme.colors.active.border,
  },
  socialButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(3),
  },
  socialIcon: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.primary,
    width: 24,
    textAlign: "center",
  },
  socialText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
  },
  terms: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.xs,
    textAlign: "center",
    marginTop: theme.spacing(8),
    lineHeight: theme.fontSize.xs * 1.4,
    color: theme.colors.text.tertiary,
  },
  termsLink: {
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.text.tertiary,
    textDecorationLine: "underline",
  },
}));
