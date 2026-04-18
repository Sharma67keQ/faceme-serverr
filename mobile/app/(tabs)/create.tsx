import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CreateGroupScreen } from "@/components/create/create-group-screen";
import { CreatePageScreen } from "@/components/create/create-page-screen";
import { CreatePostScreen } from "@/components/create/create-post-screen";
import { CreateReelScreen } from "@/components/create/create-reel-screen";
import { Screen } from "@/components/ui/screen";
import { colors, radius, spacing } from "@/utils/theme";

type CreateMode = "POST" | "PAGE" | "GROUP" | "REEL";

const modes: Array<{ key: CreateMode; label: string }> = [
  { key: "POST", label: "Post" },
  { key: "PAGE", label: "Page" },
  { key: "GROUP", label: "Group" },
  { key: "REEL", label: "Reel" },
];

export default function CreateScreen() {
  const [mode, setMode] = useState<CreateMode>("POST");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Create on Faceme</Text>
        <Text style={styles.heroBody}>Publish fast, open a new community, launch a page, or drop a reel.</Text>
      </View>

      <View style={styles.modeRow}>
        {modes.map((item) => (
          <Pressable
            key={item.key}
            style={[styles.modeChip, mode === item.key ? styles.modeChipActive : null]}
            onPress={() => {
              setMode(item.key);
              setErrorMessage(null);
            }}
          >
            <Text style={[styles.modeChipLabel, mode === item.key ? styles.modeChipLabelActive : null]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.quickLinks}>
        <Pressable style={styles.quickLink} onPress={() => router.push("/status")}>
          <Ionicons name="sparkles-outline" size={16} color={colors.primaryDark} />
          <Text style={styles.quickLinkLabel}>Status</Text>
        </Pressable>
        <Pressable style={styles.quickLink} onPress={() => router.push("/marketplace" as never)}>
          <Ionicons name="bag-outline" size={16} color={colors.primaryDark} />
          <Text style={styles.quickLinkLabel}>Marketplace</Text>
        </Pressable>
      </View>

      {mode === "POST" ? <CreatePostScreen onError={setErrorMessage} /> : null}
      {mode === "PAGE" ? <CreatePageScreen onError={setErrorMessage} /> : null}
      {mode === "GROUP" ? <CreateGroupScreen onError={setErrorMessage} /> : null}
      {mode === "REEL" ? <CreateReelScreen onError={setErrorMessage} /> : null}

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: "rgba(38, 33, 63, 0.94)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
  },
  heroBody: {
    color: colors.textMuted,
    lineHeight: 21,
  },
  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  modeChip: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modeChipActive: {
    backgroundColor: colors.primary,
  },
  modeChipLabel: {
    color: colors.textMuted,
    fontWeight: "800",
  },
  modeChipLabelActive: {
    color: colors.text,
  },
  quickLinks: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  quickLink: {
    alignItems: "center",
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  quickLinkLabel: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  errorText: {
    color: colors.danger,
  },
});
