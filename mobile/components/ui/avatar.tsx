import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/utils/theme";

type AvatarProps = {
  name: string;
  size?: number;
};

export const Avatar = memo(({ name, size = 44 }: AvatarProps) => (
  <View style={[styles.halo, { width: size + 6, height: size + 6, borderRadius: (size + 6) / 2 }]}>
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initial, { fontSize: Math.max(14, size * 0.38) }]}>{name.slice(0, 1).toUpperCase()}</Text>
    </View>
  </View>
));

const styles = StyleSheet.create({
  halo: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  avatar: {
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    justifyContent: "center",
  },
  initial: {
    color: colors.text,
    fontWeight: "800",
  },
});
