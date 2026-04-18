import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Avatar } from "@/components/ui/avatar";
import { colors, radius, spacing } from "@/utils/theme";

export const ComposerPromptCard = ({ name }: { name: string }) => (
  <View style={styles.card}>
    <View style={styles.row}>
      <Avatar name={name} size={42} />
      <Pressable style={styles.prompt} onPress={() => router.push("/create")}>
        <Text style={styles.promptLabel}>What's on your mind?</Text>
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  prompt: {
    backgroundColor: colors.backgroundStrong,
    borderRadius: radius.pill,
    flex: 1,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  promptLabel: {
    color: colors.textSoft,
    fontSize: 15,
  },
});
