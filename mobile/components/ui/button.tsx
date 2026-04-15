import { ComponentRef, forwardRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, PressableProps, StyleSheet, Text } from "react-native";
import { colors, gradients, radius, spacing } from "@/utils/theme";

type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  variant?: "primary" | "secondary";
};

export const Button = forwardRef<ComponentRef<typeof Pressable>, ButtonProps>(
  ({ label, variant = "primary", ...props }, ref) => (
    <Pressable
      ref={ref}
      {...props}
      style={[
        styles.button,
        variant === "secondary" ? styles.secondary : styles.primary,
        props.disabled ? styles.disabled : null,
      ]}
    >
      {variant === "primary" ? <LinearGradient colors={gradients.brand} style={StyleSheet.absoluteFill} /> : null}
      <Text style={[styles.label, variant === "secondary" ? styles.secondaryLabel : null]}>
        {label}
      </Text>
    </Pressable>
  ),
);

Button.displayName = "Button";

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: "rgba(255,255,255,0.14)",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 22,
    elevation: 10,
  },
  secondary: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: colors.border,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  secondaryLabel: {
    color: colors.text,
  },
  disabled: {
    opacity: 0.6,
  },
});
