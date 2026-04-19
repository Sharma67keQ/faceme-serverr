import { ErrorBoundaryProps, Stack, usePathname } from "expo-router";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppBootstrap } from "@/components/app-bootstrap";
import { AppErrorState } from "@/components/app-error-state";
import { RealtimeBridge } from "@/components/realtime-bridge";
import { RootErrorBoundary } from "@/components/root-error-boundary";
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
  const user = useAuthStore((state) => state.user);
  const bootError = useAuthStore((state) => state.bootError);
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
    <RootErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <StatusBar style="light" />
          <RealtimeBridge />
          {isHydrated ? (
            bootError && !user ? (
              <AppErrorState
                title="Connection error"
                message={bootError}
                actionLabel="Retry"
                onAction={() => void hydrate()}
              />
            ) : (
              <View style={styles.app}>
                {bootError ? <ConnectionBanner message={bootError} onRetry={() => void hydrate()} /> : null}
                {shouldShowShell ? <TopNavigation /> : null}
                <View style={styles.stackWrap}>
                  <Stack screenOptions={{ headerShown: false }} />
                </View>
              </View>
            )
          ) : (
            <AppBootstrap />
          )}
        </I18nProvider>
      </QueryClientProvider>
    </RootErrorBoundary>
  );
}

const ConnectionBanner = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <View style={styles.connectionBanner}>
    <Text style={styles.connectionText} numberOfLines={2}>
      {message}
    </Text>
    <Pressable style={styles.connectionButton} onPress={onRetry}>
      <Text style={styles.connectionButtonText}>Retry</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stackWrap: {
    flex: 1,
  },
  connectionBanner: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  connectionText: {
    color: colors.textMuted,
    flex: 1,
    lineHeight: 18,
  },
  connectionButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  connectionButtonText: {
    color: colors.text,
    fontWeight: "800",
  },
});
