import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { GuestGuard } from "@/hooks/use-auth-guard";
import { colors, gradients, radius, spacing } from "@/utils/theme";

export default function OnboardingScreen() {
  return (
    <GuestGuard>
      <Screen>
        <LinearGradient colors={gradients.card} style={styles.hero}>
          <BrandLockup />
          <Text style={styles.eyebrow}>Hybrid Social Platform</Text>
          <Text style={styles.title}>Chat, presence, conversation, and discovery in one original network.</Text>
          <Text style={styles.subtitle}>
            Faceme is built around people first: close chat, live status, active discussion, creator video, and community momentum with its own modern identity.
          </Text>
          <View style={styles.signalRow}>
            <View style={styles.signalChip}>
              <Text style={styles.signalLabel}>People-first</Text>
            </View>
            <View style={[styles.signalChip, styles.signalChipWarm]}>
              <Text style={styles.signalLabel}>Premium social</Text>
            </View>
            <View style={styles.signalChip}>
              <Text style={styles.signalLabel}>Modern identity</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.actions}>
          <Link href="/(auth)/register" asChild>
            <Button label="Create account" />
          </Link>
          <Link href="/(auth)/login" asChild>
            <Button label="I already have an account" variant="secondary" />
          </Link>
        </View>
      </Screen>
    </GuestGuard>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    justifyContent: "flex-end",
    gap: spacing.md,
    minHeight: 360,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
  },
  eyebrow: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  title: {
    color: colors.text,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  signalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  signalChip: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  signalChipWarm: {
    backgroundColor: colors.energySoft,
    borderColor: colors.borderStrong,
  },
  signalLabel: {
    color: colors.primaryDark,
    fontWeight: "800",
    fontSize: 12,
  },
  actions: {
    gap: spacing.sm,
  },
});
