import { Pressable, StyleSheet, Text, View } from "react-native";
import { Input } from "@/components/ui/input";
import { colors, radius, spacing } from "@/utils/theme";

type TextPostComposerProps = {
  body: string;
  onBodyChange: (value: string) => void;
  kind: "STANDARD" | "QUICK";
  onKindChange: (value: "STANDARD" | "QUICK") => void;
};

export const TextPostComposer = ({
  body,
  onBodyChange,
  kind,
  onKindChange,
}: TextPostComposerProps) => (
  <View style={styles.wrapper}>
    <Input
      label="Post body"
      value={body}
      onChangeText={onBodyChange}
      multiline
      placeholder="Maxaa maskaxdaada ku jira?"
    />
    <View style={styles.row}>
      {(["STANDARD", "QUICK"] as const).map((value) => (
        <Pressable
          key={value}
          style={[styles.chip, kind === value ? styles.chipActive : null]}
          onPress={() => onKindChange(value)}
        >
          <Text style={[styles.label, kind === value ? styles.labelActive : null]}>
            {value === "STANDARD" ? "Standard" : "Quick"}
          </Text>
        </Pressable>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  labelActive: {
    color: colors.text,
  },
});
