import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { colors, radius, spacing } from "@/utils/theme";

type ListCardProps = {
  title: string;
  subtitle?: string;
  trailing?: string;
  onPress?: () => void;
};

export const ListCard = memo(({ title, subtitle, trailing, onPress }: ListCardProps) => {
  const content = (
    <View style={[styles.card, !onPress ? styles.cardStatic : null]}>
      <View style={styles.row}>
        <Avatar name={title} size={44} />
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
        </View>
        {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return <Pressable onPress={onPress}>{content}</Pressable>;
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardStatic: {
    opacity: 0.92,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  trailing: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
  },
});
