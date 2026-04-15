import { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/utils/theme";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  style?: ViewStyle;
}>;

export const Screen = ({ children, scroll = false, style }: ScreenProps) => {
  if (scroll) {
    return (
      <SafeAreaView style={styles.safe} edges={["left", "right"]}>
        <View pointerEvents="none" style={styles.glowTop} />
        <View pointerEvents="none" style={styles.glowBottom} />
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={[styles.content, style]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />
      <KeyboardAvoidingView
        style={[styles.safe, styles.content, style]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glowTop: {
    backgroundColor: "rgba(123, 92, 255, 0.24)",
    borderRadius: 180,
    height: 240,
    position: "absolute",
    right: -110,
    top: -90,
    width: 240,
  },
  glowBottom: {
    backgroundColor: "rgba(47, 139, 255, 0.18)",
    borderRadius: 170,
    bottom: -120,
    height: 220,
    left: -90,
    position: "absolute",
    width: 220,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 120,
    gap: spacing.lg,
  },
});
