import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing } from "@/utils/theme";

const dockItems = [
  { icon: "home", href: "/", label: "Home" },
  { icon: "play-circle", href: "/reels", label: "Video" },
  { icon: "storefront", href: "/marketplace", label: "Marketplace" },
  { icon: "people", href: "/communities", label: "Groups" },
  { icon: "notifications", href: "/notifications", label: "Alerts" },
  { icon: "menu", href: "/menu", label: "Menu" },
] as const;

const isActivePath = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
};

export const TopNavigation = () => {
  const pathname = usePathname();

  return (
    <>
      <SafeAreaView style={styles.safeHeader} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>Faceme</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerIcon} onPress={() => router.push("/explore")}>
              <Ionicons name="search" size={20} color={colors.text} />
            </Pressable>
            <Pressable style={styles.headerIcon} onPress={() => router.push("/chats")}>
              <Ionicons name="chatbubble" size={18} color={colors.text} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.dockWrap} pointerEvents="box-none">
        <View style={styles.dock}>
          {dockItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Pressable key={item.href} style={styles.dockItem} onPress={() => router.push(item.href as never)}>
                <Ionicons
                  name={item.icon as keyof typeof Ionicons.glyphMap}
                  size={22}
                  color={active ? colors.primary : colors.textSoft}
                />
                <Text style={[styles.dockLabel, active ? styles.dockLabelActive : null]}>{item.label}</Text>
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
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  wordmark: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "800",
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  headerIcon: {
    alignItems: "center",
    backgroundColor: colors.backgroundStrong,
    borderRadius: radius.pill,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  dockWrap: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 20,
  },
  dock: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  dockItem: {
    alignItems: "center",
    flex: 1,
    gap: 2,
    paddingVertical: spacing.xs,
  },
  dockLabel: {
    color: colors.textSoft,
    fontSize: 10,
    fontWeight: "600",
  },
  dockLabelActive: {
    color: colors.primary,
  },
});
