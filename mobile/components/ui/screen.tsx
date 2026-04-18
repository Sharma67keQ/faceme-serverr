import { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ViewStyle } from "react-native";
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
        <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === "ios" ? "padding" : undefined}>
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
      <KeyboardAvoidingView style={[styles.safe, styles.content, style]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 96,
    gap: spacing.md,
  },
});
