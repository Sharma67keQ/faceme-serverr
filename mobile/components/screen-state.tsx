import { Pressable, StyleSheet, Text, View } from "react-native";
import { NeonLogo } from "@/components/brand/neon-logo";
import { colors, radius, spacing } from "@/utils/theme";

type ScreenStateProps = {
  title: string;
  message?: string;
  variant?: "loading" | "error" | "empty";
  actionLabel?: string;
  onAction?: () => void;
};

export const ScreenState = ({
  title,
  message,
  variant = "empty",
  actionLabel,
  onAction,
}: ScreenStateProps) => (
  <View style={styles.container}>
    <View style={styles.card}>
      <NeonLogo size={variant === "loading" ? 54 : 44} animated={variant === "loading"} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {onAction ? (
        <Pressable style={styles.button} onPress={onAction}>
          <Text style={styles.buttonLabel}>{actionLabel ?? "Retry"}</Text>
        </Pressable>
      ) : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 220,
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    maxWidth: 420,
    padding: spacing.xl,
    width: "100%",
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  message: {
    color: colors.textMuted,
    lineHeight: 21,
    textAlign: "center",
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
