import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing } from "@/utils/theme";

type InputProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  multiline?: boolean;
};

export const Input = ({ label, ...props }: InputProps) => (
  <View style={styles.wrapper}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      placeholderTextColor={colors.textSoft}
      style={[styles.input, props.multiline ? styles.multiline : null]}
      {...props}
    />
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    minHeight: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  multiline: {
    minHeight: 110,
    paddingVertical: spacing.md,
    textAlignVertical: "top",
  },
});
