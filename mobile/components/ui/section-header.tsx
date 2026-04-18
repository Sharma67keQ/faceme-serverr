import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/utils/theme";

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  href?: string;
};

export const SectionHeader = ({ title, actionLabel, href }: SectionHeaderProps) => (
  <View style={styles.row}>
    <Text style={styles.title}>{title}</Text>
    {actionLabel && href ? (
      <Link href={href as never}>
        <Text style={styles.action}>{actionLabel}</Text>
      </Link>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  action: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});
