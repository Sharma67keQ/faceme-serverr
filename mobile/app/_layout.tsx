import { ErrorBoundaryProps, Stack, usePathname } from "expo-router";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { AppBootstrap } from "@/components/app-bootstrap";
import { AppErrorState } from "@/components/app-error-state";
import { RealtimeBridge } from "@/components/realtime-bridge";
import { TopNavigation } from "@/components/top-navigation";
import { I18nProvider } from "@/services/i18n";
import { useAuthStore } from "@/store/auth-store";
import { logger } from "@/utils/logger";
import { colors } from "@/utils/theme";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      logger.error("Query failed", query.queryKey, error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      logger.error("Mutation failed", mutation.options.mutationKey ?? "unknown-mutation", error);
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 15_000,
    },
  },
});

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  logger.error("Route render crashed", error);
  return (
    <AppErrorState
      title="Faceme could not open this screen"
      message={error.message || "An unexpected runtime error blocked the screen from rendering."}
      onAction={retry}
    />
  );
}

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const pathname = usePathname();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const shellRoutes = new Set([
    "/",
    "/communities",
    "/explore",
    "/friends",
    "/marketplace",
    "/menu",
    "/moderation",
    "/notifications",
    "/pages",
    "/profile",
    "/reels",
    "/saved",
    "/settings",
    "/status",
    "/chats",
    "/create",
  ]);

  const shouldShowShell = Boolean(isHydrated && accessToken && shellRoutes.has(pathname));

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <StatusBar style="light" />
        <RealtimeBridge />
        {isHydrated ? (
          <View style={styles.app}>
            {shouldShowShell ? <TopNavigation /> : null}
            <View style={styles.stackWrap}>
              <Stack screenOptions={{ headerShown: false }} />
            </View>
          </View>
        ) : (
          <AppBootstrap />
        )}
      </I18nProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stackWrap: {
    flex: 1,
  },
});
