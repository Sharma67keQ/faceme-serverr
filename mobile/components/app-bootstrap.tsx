import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { NeonLogo } from "@/components/brand/neon-logo";
import { useI18n } from "@/services/i18n";
import { colors, gradients, spacing } from "@/utils/theme";

export const AppBootstrap = () => {
  const { t } = useI18n();

  return (
    <LinearGradient colors={gradients.canvas} style={styles.container}>
      <NeonLogo size={84} animated />
      <Text style={styles.title}>{t("appBootstrap.title")}</Text>
      <Text style={styles.body}>{t("appBootstrap.body")}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  body: {
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: "center",
  },
});
