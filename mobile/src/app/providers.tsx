import "@shared/i18n"; // Inicializar i18next
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { UnistylesRuntime } from "react-native-unistyles";
import { preferences } from "@/shared/utils";
import { clerkConfig } from "@/shared/config/clerk";
import { setClerkTokenGetter } from "@/shared/lib/api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Token cache for Clerk using SecureStore
const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  async saveToken(key: string, token: string) {
    try {
      await SecureStore.setItemAsync(key, JSON.stringify(token));
    } catch {
      // Ignore
    }
  },
  async deleteToken(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore
    }
  },
};

// Theme Initializer - Aplica el tema guardado lo antes posible
function ThemeInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const savedTheme = preferences.getTheme();

    if (savedTheme && savedTheme !== "system") {
      UnistylesRuntime.setAdaptiveThemes(false);
      UnistylesRuntime.setTheme(savedTheme);
    }
  }, []);

  return <>{children}</>;
}

// API Token Initializer - Configura el token getter para API calls
function ApiTokenInitializer({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    // Inicializar el token getter globalmente para todas las llamadas API
    if (getToken) {
      setClerkTokenGetter(getToken);
    }
  }, [getToken]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={clerkConfig.publishableKey}>
      <ApiTokenInitializer>
        <QueryClientProvider client={queryClient}>
          <ThemeInitializer>{children}</ThemeInitializer>
        </QueryClientProvider>
      </ApiTokenInitializer>
    </ClerkProvider>
  );
}

export { queryClient };
