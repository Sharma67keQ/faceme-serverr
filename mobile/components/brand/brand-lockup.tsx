import { StyleSheet, Text, View } from "react-native";
import { brand, colors, spacing } from "@/utils/theme";
import { NeonLogo } from "./neon-logo";

type BrandLockupProps = {
  compact?: boolean;
};

export const BrandLockup = ({ compact = false }: BrandLockupProps) => (
  <View style={[styles.row, compact ? styles.rowCompact : null]}>
    <NeonLogo size={compact ? 42 : 64} />
    <View style={styles.copy}>
      <Text style={[styles.name, compact ? styles.nameCompact : null]}>{brand.name}</Text>
      {!compact ? <Text style={styles.tagline}>{brand.tagline}</Text> : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  rowCompact: {
    gap: spacing.sm,
  },
  copy: {
    gap: 2,
  },
  name: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  nameCompact: {
    fontSize: 20,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 0.2,
  },
});
