import { Href, router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useAuthStore } from "@/store/auth-store";
import { ListCard } from "@/components/ui/list-card";
import { Screen } from "@/components/ui/screen";
import { SectionHeader } from "@/components/ui/section-header";
import { colors, radius, spacing } from "@/utils/theme";

const menuSections = [
  {
    title: "Your Faceme",
    items: [
      { label: "Profile", href: "/profile" as Href },
      { label: "Saved", href: "/saved" as Href },
      { label: "Status", href: "/status" as Href },
    ],
  },
  {
    title: "Discover",
    items: [
      { label: "Friends", href: "/friends" as Href },
      { label: "Groups", href: "/communities" as Href },
      { label: "Marketplace", href: "/marketplace" as Href },
      { label: "Pages", href: "/pages" as Href },
      { label: "Video", href: "/reels" as Href },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "Explore", href: "/explore" as Href },
      { label: "Settings", href: "/settings" as Href },
    ],
  },
];

export default function MenuScreen() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <Screen scroll>
      <View style={styles.profileCard}>
        <View style={styles.avatar} />
        <View>
          <Text style={styles.name}>{user?.firstName ?? user?.username ?? "Faceme"}</Text>
          <Text style={styles.meta}>@{user?.username ?? "profile"}</Text>
        </View>
      </View>

      {menuSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <SectionHeader title={section.title} />
          {section.items.map((item) => (
            <ListCard key={item.label} title={item.label} subtitle="Open section" onPress={() => router.push(item.href)} />
          ))}
        </View>
      ))}

      <View style={styles.section}>
        <SectionHeader title="Account" />
        <ListCard
          title="Log out"
          subtitle="Sign out of this device"
          onPress={() => {
            void signOut().then(() => router.replace("/login"));
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  avatar: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 56,
    width: 56,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  meta: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    gap: spacing.sm,
  },
});
