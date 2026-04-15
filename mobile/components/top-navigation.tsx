import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NeonLogo } from "@/components/brand/neon-logo";
import { useAuthStore } from "@/store/auth-store";
import { colors, gradients, radius, spacing } from "@/utils/theme";

const dockItems = [
  { icon: "home-outline", activeIcon: "home", href: "/(tabs)" },
  { icon: "people-outline", activeIcon: "people", href: "/communities" },
  { icon: "chatbubble-ellipses-outline", activeIcon: "chatbubble-ellipses", href: "/(tabs)/chats" },
  { icon: "bag-outline", activeIcon: "bag", href: "/marketplace" },
  { icon: "person-outline", activeIcon: "person", href: "/(tabs)/profile" },
] as const;

const isActivePath = (pathname: string, href: string) => {
  if (href === "/(tabs)") {
    return pathname === "/" || pathname === "/(tabs)";
  }

  return pathname.startsWith(href.replace("/(tabs)", ""));
};

export const TopNavigation = () => {
  const pathname = usePathname();
  const currentUser = useAuthStore((state) => state.user);

  return (
    <>
      <SafeAreaView style={styles.safeHeader} edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.sideBlock}>
            <NeonLogo size={38} />
          </View>
          <Text style={styles.wordmark}>Faceme</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerIcon} onPress={() => router.push("/explore")}>
              <Ionicons name="search" size={20} color={colors.text} />
            </Pressable>
            <Pressable style={styles.headerIcon} onPress={() => router.push("/(tabs)/chats")}>
              <Ionicons name="chatbubble-ellipses" size={19} color={colors.text} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.dockWrap} pointerEvents="box-none">
        <View style={styles.dock}>
          {dockItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const iconName =
              item.href === "/(tabs)/profile" && currentUser?.avatarUrl
                ? active
                  ? "person-circle"
                  : "person-circle-outline"
                : active
                  ? item.activeIcon
                  : item.icon;

            return (
              <Pressable key={item.href} style={styles.dockItem} onPress={() => router.push(item.href as never)}>
                <View style={[styles.dockIconWrap, active ? styles.dockIconWrapActive : null]}>
                  {active ? <LinearGradient colors={gradients.brand} style={StyleSheet.absoluteFill} /> : null}
                  <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={21} color={active ? colors.text : colors.textSoft} />
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  safeHeader: {
    backgroundColor: colors.background,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  brandBlock: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: spacing.sm,
  },
  sideBlock: {
    flex: 1,
  },
  wordmark: {
    color: colors.text,
    flex: 1,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: spacing.sm,
    justifyContent: "flex-end",
  },
  headerIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    width: 38,
  },
  dockWrap: {
    bottom: spacing.md,
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 20,
  },
  dock: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(22, 18, 39, 0.94)",
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.34,
    shadowRadius: 24,
    elevation: 12,
    width: "92%",
  },
  dockItem: { alignItems: "center", flex: 1 },
  dockIconWrap: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 42,
    justifyContent: "center",
    overflow: "hidden",
    width: 40,
  },
  dockIconWrapActive: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 16,
  },
});
