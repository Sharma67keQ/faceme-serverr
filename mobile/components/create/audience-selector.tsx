import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/utils/theme";

type Audience = "PUBLIC" | "FOLLOWERS" | "FRIENDS";

type AudienceSelectorProps = {
  value: Audience;
  onChange: (value: Audience) => void;
};

const audiences: Audience[] = ["PUBLIC", "FOLLOWERS", "FRIENDS"];

export const AudienceSelector = ({ value, onChange }: AudienceSelectorProps) => (
  <View style={styles.row}>
    {audiences.map((audience) => (
      <Pressable
        key={audience}
        style={[styles.chip, value === audience ? styles.chipActive : null]}
        onPress={() => onChange(audience)}
      >
        <Text style={[styles.label, value === audience ? styles.labelActive : null]}>{audience}</Text>
      </Pressable>
    ))}
  </View>
);

const styles = StyleSheet.create({
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
